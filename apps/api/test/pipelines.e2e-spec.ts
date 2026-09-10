import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { seedDemoData } from "@nexus/database";
import * as schema from "@nexus/database";
import cookieParser from "cookie-parser";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Pipelines (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let paymentsPipelineId: string;
  let paymentsRunId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const paymentsService = await db.query.services.findFirst({
      where: eq(schema.services.slug, "payments-api"),
    });
    const pipeline = await db.query.pipelines.findFirst({
      where: eq(schema.pipelines.serviceId, paymentsService!.id),
    });
    paymentsPipelineId = pipeline!.id;
    const run = await db.query.pipelineRuns.findFirst({
      where: eq(schema.pipelineRuns.pipelineId, paymentsPipelineId),
    });
    paymentsRunId = run!.id;

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
    const response = await request(app.getHttpServer()).get("/pipelines");
    expect(response.status).toBe(401);
  });

  it("lista os pipelines com a última execução", async () => {
    const response = await request(app.getHttpServer()).get("/pipelines").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("latestRun");
  });

  it("filtra por service", async () => {
    const response = await request(app.getHttpServer())
      .get("/pipelines?service=payments-api")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].serviceSlug).toBe("payments-api");
  });

  it("retorna o detalhe do pipeline com o histórico de execuções", async () => {
    const response = await request(app.getHttpServer())
      .get(`/pipelines/${paymentsPipelineId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.pipeline.serviceSlug).toBe("payments-api");
    expect(response.body.runs.items.length).toBeGreaterThan(0);
  });

  it("retorna 404 para um pipeline inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/pipelines/00000000-0000-0000-0000-000000000000")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("retorna o detalhe de uma execução com os stages ordenados e logs", async () => {
    const response = await request(app.getHttpServer())
      .get(`/pipelines/runs/${paymentsRunId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.run.id).toBe(paymentsRunId);
    expect(response.body.stages).toHaveLength(5);
    expect(response.body.stages[0].name).toBe("Build");
    expect(response.body.stages.some((stage: { logs: string | null }) => stage.logs)).toBe(true);
  });

  it("retorna 404 para uma execução inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/pipelines/runs/00000000-0000-0000-0000-000000000000")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("não vaza um pipeline de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Pipelines", slug: "other-corp-e2e-pipelines" })
      .returning();
    const otherService = await db
      .insert(schema.services)
      .values({
        organizationId: otherOrg[0]!.id,
        name: "other-service-pipeline",
        slug: "other-service-pipeline-e2e",
        type: "api",
        lifecycle: "production",
      })
      .returning();
    const otherPipeline = await db
      .insert(schema.pipelines)
      .values({ serviceId: otherService[0]!.id, name: "other-service-ci" })
      .returning();

    const response = await request(app.getHttpServer())
      .get(`/pipelines/${otherPipeline[0]!.id}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
