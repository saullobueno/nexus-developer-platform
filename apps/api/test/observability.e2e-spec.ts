import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { seedDemoData } from "@nexus/database";
import * as schema from "@nexus/database";
import cookieParser from "cookie-parser";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Observability (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let traceId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const trace = await db.query.traces.findFirst();
    traceId = trace!.id;

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
    const response = await request(app.getHttpServer()).get("/observability/metrics");
    expect(response.status).toBe(401);
  });

  it("retorna séries de métricas para o range informado", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/metrics?range=24h")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.range).toBe("24h");
    expect(response.body.series.length).toBeGreaterThan(0);
    expect(response.body.series[0].points.length).toBeGreaterThan(0);
  });

  it("filtra métricas por service", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/metrics?service=payments-api&range=24h")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.series.length).toBeGreaterThan(0);
  });

  it("lista logs paginados e filtra por level", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/logs?level=error&pageSize=10")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(
      response.body.items.every((item: { level: string }) => item.level === "error"),
    ).toBe(true);
  });

  it("rejeita paginação inválida em logs", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/logs?page=0")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(400);
  });

  it("lista traces paginados", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/traces")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("retorna o detalhe de um trace com os spans em ordem", async () => {
    const response = await request(app.getHttpServer())
      .get(`/observability/traces/${traceId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.trace.id).toBe(traceId);
    expect(Array.isArray(response.body.spans)).toBe(true);
    expect(response.body.spans.length).toBeGreaterThan(0);
  });

  it("retorna 404 para um trace inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/traces/00000000-0000-0000-0000-000000000000")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("lista error events agrupados por serviço", async () => {
    const response = await request(app.getHttpServer())
      .get("/observability/errors")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("occurrences");
  });

  it("não vaza um trace de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E", slug: "other-corp-e2e" })
      .returning();
    const otherService = await db
      .insert(schema.services)
      .values({
        organizationId: otherOrg[0]!.id,
        name: "other-service",
        slug: "other-service-e2e",
        type: "api",
        lifecycle: "production",
      })
      .returning();
    const otherTrace = await db
      .insert(schema.traces)
      .values({ traceId: "other-org-trace", serviceId: otherService[0]!.id, startedAt: new Date() })
      .returning();

    const response = await request(app.getHttpServer())
      .get(`/observability/traces/${otherTrace[0]!.id}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
