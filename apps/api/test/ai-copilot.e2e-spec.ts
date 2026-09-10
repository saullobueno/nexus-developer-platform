import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { seedDemoData, seedUserWithRole } from "@nexus/database";
import * as schema from "@nexus/database";
import cookieParser from "cookie-parser";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("AI Copilot (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let viewerCookie: string;
  let approvedToolCallId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const organization = await db.query.organizations.findFirst();
    await seedUserWithRole(db, {
      organizationId: organization!.id,
      email: "viewer@acme.test",
      name: "Viewer Demo",
      password: "demo1234",
      roleSlug: "viewer",
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@acme.test", password: "demo1234" });
    const adminSetCookie = adminLogin.headers["set-cookie"];
    adminCookie = Array.isArray(adminSetCookie) ? adminSetCookie[0]! : adminSetCookie;

    const viewerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "viewer@acme.test", password: "demo1234" });
    const viewerSetCookie = viewerLogin.headers["set-cookie"];
    viewerCookie = Array.isArray(viewerSetCookie) ? viewerSetCookie[0]! : viewerSetCookie;
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  it("nega acesso sem autenticação", async () => {
    const response = await request(app.getHttpServer()).post("/ai-copilot/ask").send({ question: "oi" });
    expect(response.status).toBe(401);
  });

  it("nega ask para quem não tem ai_copilot:use", async () => {
    const response = await request(app.getHttpServer())
      .post("/ai-copilot/ask")
      .set("Cookie", viewerCookie)
      .send({ question: "Who owns payments-api?" });
    expect(response.status).toBe(403);
  });

  it("responde 'Who owns payments-api?' usando o orchestrator demo e persiste o run", async () => {
    const response = await request(app.getHttpServer())
      .post("/ai-copilot/ask")
      .set("Cookie", adminCookie)
      .send({ question: "Who owns payments-api?" });

    expect(response.status).toBe(201);
    expect(response.body.usingMock).toBe(true);
    expect(response.body.evidence.length).toBeGreaterThan(0);
    expect(response.body.run.status).toBe("completed");

    const detail = await request(app.getHttpServer())
      .get(`/ai-copilot/runs/${response.body.run.id}`)
      .set("Cookie", adminCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.messages).toHaveLength(2);
    expect(detail.body.evidence.length).toBeGreaterThan(0);
  });

  it("rejeita uma pergunta vazia", async () => {
    const response = await request(app.getHttpServer())
      .post("/ai-copilot/ask")
      .set("Cookie", adminCookie)
      .send({ question: "" });
    expect(response.status).toBe(400);
  });

  it("propõe rollback_deployment quando o serviço está degradado e o último deploy foi bem-sucedido, e permite aprovar", async () => {
    const paymentsService = await db.query.services.findFirst({
      where: eq(schema.services.slug, "payments-api"),
    });
    const productionEnvironment = await db.query.environments.findFirst({
      where: eq(schema.environments.slug, "production"),
    });
    const [latestDeployment] = await db
      .insert(schema.deployments)
      .values({
        serviceId: paymentsService!.id,
        environmentId: productionEnvironment!.id,
        version: "9.9.9",
        status: "successful",
        startedAt: new Date(),
        finishedAt: new Date(),
      })
      .returning();

    const askResponse = await request(app.getHttpServer())
      .post("/ai-copilot/ask")
      .set("Cookie", adminCookie)
      .send({ question: "Why is payments-api slow today?" });

    expect(askResponse.status).toBe(201);
    expect(askResponse.body.requiresApproval).toBe(true);
    expect(askResponse.body.run.status).toBe("requires_approval");

    const detail = await request(app.getHttpServer())
      .get(`/ai-copilot/runs/${askResponse.body.run.id}`)
      .set("Cookie", adminCookie);
    expect(detail.body.pendingActions).toHaveLength(1);
    const pendingAction = detail.body.pendingActions[0];
    expect(pendingAction.toolName).toBe("rollback_deployment");
    expect(pendingAction.input.deploymentId).toBe(latestDeployment!.id);

    approvedToolCallId = pendingAction.id;
    const approveResponse = await request(app.getHttpServer())
      .post(`/ai-copilot/tool-calls/${pendingAction.id}/approve`)
      .set("Cookie", adminCookie);
    expect(approveResponse.status).toBe(201);
    expect(approveResponse.body.approvedAt).toBeTruthy();

    const rolledBack = await db.query.deployments.findFirst({
      where: eq(schema.deployments.id, latestDeployment!.id),
    });
    expect(rolledBack?.status).toBe("rolled_back");
  });

  it("não permite aprovar a mesma ação duas vezes", async () => {
    const response = await request(app.getHttpServer())
      .post(`/ai-copilot/tool-calls/${approvedToolCallId}/approve`)
      .set("Cookie", adminCookie);
    expect(response.status).toBe(400);
  });

  it("declara falta de evidência quando a pergunta não menciona nenhum serviço conhecido", async () => {
    const response = await request(app.getHttpServer())
      .post("/ai-copilot/ask")
      .set("Cookie", adminCookie)
      .send({ question: "Show services using PostgreSQL" });

    expect(response.status).toBe(201);
    expect(response.body.confidence).toBe(0);
    expect(response.body.evidence).toHaveLength(0);
  });
});
