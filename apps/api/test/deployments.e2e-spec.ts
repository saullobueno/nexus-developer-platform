import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { seedDemoData } from "@nexus/database";
import * as schema from "@nexus/database";
import cookieParser from "cookie-parser";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Deployments (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let successfulDeploymentId: string;
  let failedDeploymentId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const paymentsService = await db.query.services.findFirst({
      where: eq(schema.services.slug, "payments-api"),
    });
    const productionEnvironment = await db.query.environments.findFirst({
      where: eq(schema.environments.slug, "production"),
    });
    const paymentsDeployments = await db
      .select()
      .from(schema.deployments)
      .where(eq(schema.deployments.serviceId, paymentsService!.id))
      .orderBy(desc(schema.deployments.createdAt));

    const successful = paymentsDeployments.find((deployment) => deployment.status === "successful");
    successfulDeploymentId = successful!.id;

    // Insere um deployment com status "failed" dedicado ao teste de retry, em vez de
    // depender do status aleatório gerado pelo demo-seed (evita teste flaky).
    const [failedDeployment] = await db
      .insert(schema.deployments)
      .values({
        serviceId: paymentsService!.id,
        environmentId: productionEnvironment!.id,
        version: "9.9.9",
        status: "failed",
      })
      .returning();
    failedDeploymentId = failedDeployment!.id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@acme.test", password: "demo1234" });
    const cookie = loginResponse.headers["set-cookie"];
    adminCookie = Array.isArray(cookie) ? cookie[0]! : cookie;
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it("nega acesso sem autenticação", async () => {
    const response = await request(app.getHttpServer()).get("/deployments");
    expect(response.status).toBe(401);
  });

  it("lista deployments paginados, mais recentes primeiro", async () => {
    const response = await request(app.getHttpServer())
      .get("/deployments?pageSize=5")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("filtra deployments por service", async () => {
    const response = await request(app.getHttpServer())
      .get("/deployments?service=payments-api")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(
      response.body.items.every((item: { serviceSlug: string }) => item.serviceSlug === "payments-api"),
    ).toBe(true);
  });

  it("retorna o detalhe com stages do pipeline e logs", async () => {
    const response = await request(app.getHttpServer())
      .get(`/deployments/${successfulDeploymentId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.deployment.id).toBe(successfulDeploymentId);
    expect(Array.isArray(response.body.stages)).toBe(true);
    expect(response.body.stages.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.logs)).toBe(true);
  });

  it("retorna 404 para um deployment inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/deployments/00000000-0000-0000-0000-000000000000")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("rejeita cancelar um deployment que não está em andamento", async () => {
    const response = await request(app.getHttpServer())
      .post(`/deployments/${successfulDeploymentId}/cancel`)
      .set("Cookie", adminCookie);
    expect(response.status).toBe(400);
  });

  it("faz rollback de um deployment bem-sucedido e registra audit log", async () => {
    const response = await request(app.getHttpServer())
      .post(`/deployments/${successfulDeploymentId}/rollback`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("successful");

    const original = await db.query.deployments.findFirst({
      where: eq(schema.deployments.id, successfulDeploymentId),
    });
    expect(original?.status).toBe("rolled_back");

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.resource, "deployment"), eq(schema.auditLogs.action, "deployment.rollback")));
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("permite refazer (retry) um deployment que falhou", async () => {
    const response = await request(app.getHttpServer())
      .post(`/deployments/${failedDeploymentId}/retry`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("queued");
    expect(response.body.id).not.toBe(failedDeploymentId);
  });
});
