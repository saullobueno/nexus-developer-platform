import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { seedDemoData } from "@nexus/database";
import * as schema from "@nexus/database";
import cookieParser from "cookie-parser";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Integrations (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

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

  afterEach(() => {
    delete process.env.DEMO_MODE;
    vi.unstubAllGlobals();
  });

  it("nega acesso sem autenticação", async () => {
    const response = await request(app.getHttpServer()).get("/integrations");
    expect(response.status).toBe(401);
  });

  it("lista os providers suportados como não configurados por padrão", async () => {
    const response = await request(app.getHttpServer()).get("/integrations").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    const github = response.body.find((item: { provider: string }) => item.provider === "github");
    expect(github).toMatchObject({ configured: false, enabled: false });
  });

  it("salva a config de um provider e mascara segredos na resposta", async () => {
    const response = await request(app.getHttpServer())
      .put("/integrations/github")
      .set("Cookie", adminCookie)
      .send({ config: { token: "ghp_supersecret", owner: "acme" }, enabled: true });

    expect(response.status).toBe(200);
    expect(response.body.configured).toBe(true);
    expect(response.body.config.token).toBe("••••••••");
    expect(response.body.config.owner).toBe("acme");

    const stored = await db.query.integrations.findFirst({
      where: and(eq(schema.integrations.provider, "github")),
    });
    expect((stored?.config as { token: string }).token).toBe("ghp_supersecret");

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.resource, "integration"), eq(schema.auditLogs.action, "integration.configure")));
    expect(auditRows.length).toBeGreaterThan(0);
    expect(JSON.stringify(auditRows[0]!.after)).not.toContain("ghp_supersecret");
  });

  it("rejeita um provider desconhecido", async () => {
    const response = await request(app.getHttpServer())
      .put("/integrations/not-a-provider")
      .set("Cookie", adminCookie)
      .send({ config: {}, enabled: true });
    expect(response.status).toBe(400);
  });

  it("testConnection usa MockAdapter quando DEMO_MODE está ligado", async () => {
    process.env.DEMO_MODE = "true";
    const response = await request(app.getHttpServer())
      .post("/integrations/github/test")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true, usingMock: true, repositoryCount: 8 });
  });

  it("testConnection tenta o adapter real e reporta falha quando a chamada externa falha", async () => {
    process.env.DEMO_MODE = "false";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unreachable")));

    const response = await request(app.getHttpServer())
      .post("/integrations/github/test")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(201);
    expect(response.body.usingMock).toBe(false);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe("network unreachable");
  });
});
