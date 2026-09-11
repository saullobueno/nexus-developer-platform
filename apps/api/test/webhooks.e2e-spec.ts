import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { verifyPassword } from "@nexus/auth";
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

describe("Webhooks (e2e)", () => {
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

  it("nega acesso sem autenticação", async () => {
    const response = await request(app.getHttpServer()).get("/webhooks");
    expect(response.status).toBe(401);
  });

  it("cria um webhook, retorna o segredo em texto puro apenas na criação e persiste só o hash", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/webhooks")
      .set("Cookie", adminCookie)
      .send({ url: "https://status.example.com/hooks/nexus", events: ["deployment.completed"] });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.secret).toEqual(expect.any(String));
    expect(createResponse.body.url).toBe("https://status.example.com/hooks/nexus");

    const stored = await db.query.webhooks.findFirst({ where: eq(schema.webhooks.id, createResponse.body.id) });
    expect(stored!.secretHash).not.toBe(createResponse.body.secret);
    expect(await verifyPassword(createResponse.body.secret, stored!.secretHash)).toBe(true);

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.action, "webhook.create"));
    expect(auditRows.length).toBeGreaterThan(0);
    expect(JSON.stringify(auditRows[0]!.after)).not.toContain(createResponse.body.secret);
  });

  it("lista webhooks sem expor o secretHash", async () => {
    const response = await request(app.getHttpServer()).get("/webhooks").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].secretHash).toBeUndefined();
    expect(response.body[0].secret).toBeUndefined();
  });

  it("rejeita uma URL inválida", async () => {
    const response = await request(app.getHttpServer())
      .post("/webhooks")
      .set("Cookie", adminCookie)
      .send({ url: "not-a-url", events: ["deployment.completed"] });
    expect(response.status).toBe(400);
  });

  it("remove um webhook e registra audit log", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/webhooks")
      .set("Cookie", adminCookie)
      .send({ url: "https://status.example.com/hooks/to-delete", events: ["incident.created"] });

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/webhooks/${createResponse.body.id}`)
      .set("Cookie", adminCookie);
    expect(deleteResponse.status).toBe(200);

    const stored = await db.query.webhooks.findFirst({ where: eq(schema.webhooks.id, createResponse.body.id) });
    expect(stored).toBeUndefined();

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.action, "webhook.delete"));
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("não permite remover um webhook de outra organização", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Webhooks", slug: "other-corp-e2e-webhooks" })
      .returning();
    const otherWebhook = await db
      .insert(schema.webhooks)
      .values({ organizationId: otherOrg[0]!.id, url: "https://other.example.com/hook", events: ["x"], secretHash: "irrelevant" })
      .returning();

    const response = await request(app.getHttpServer())
      .delete(`/webhooks/${otherWebhook[0]!.id}`)
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });
});
