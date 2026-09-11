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
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Settings (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let brunoUserId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const bruno = await db.query.users.findFirst({ where: eq(schema.users.email, "bruno.alves@acme.test") });
    brunoUserId = bruno!.id;

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
    const response = await request(app.getHttpServer()).get("/settings/organization");
    expect(response.status).toBe(401);
  });

  it("retorna e atualiza a organização, registrando audit log", async () => {
    const getResponse = await request(app.getHttpServer())
      .get("/settings/organization")
      .set("Cookie", adminCookie);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe("Acme Engineering");

    const patchResponse = await request(app.getHttpServer())
      .patch("/settings/organization")
      .set("Cookie", adminCookie)
      .send({ timezone: "America/Sao_Paulo" });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.timezone).toBe("America/Sao_Paulo");

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.resource, "organization"), eq(schema.auditLogs.action, "organization.update")));
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("lista membros com suas roles", async () => {
    const response = await request(app.getHttpServer()).get("/settings/members").set("Cookie", adminCookie);
    expect(response.status).toBe(200);
    const bruno = response.body.find((member: { email: string }) => member.email === "bruno.alves@acme.test");
    expect(bruno.roles[0].slug).toBe("developer");
  });

  it("altera a role de um membro, registrando audit log", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/settings/members/${brunoUserId}/role`)
      .set("Cookie", adminCookie)
      .send({ roleSlug: "tech-lead" });

    expect(response.status).toBe(200);
    expect(response.body.roles[0].slug).toBe("tech-lead");

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.resource, "user"), eq(schema.auditLogs.action, "member.update_role")));
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("rejeita uma role desconhecida", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/settings/members/${brunoUserId}/role`)
      .set("Cookie", adminCookie)
      .send({ roleSlug: "not-a-role" });
    expect(response.status).toBe(400);
  });

  it("lista as 5 roles baseline com suas permissions", async () => {
    const response = await request(app.getHttpServer()).get("/settings/roles").set("Cookie", adminCookie);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    const admin = response.body.find((role: { slug: string }) => role.slug === "admin");
    expect(admin.permissions).toContain("ai_copilot:use");
  });

  it("lista os environments", async () => {
    const response = await request(app.getHttpServer()).get("/settings/environments").set("Cookie", adminCookie);
    expect(response.status).toBe(200);
    expect(response.body.some((env: { slug: string }) => env.slug === "production")).toBe(true);
  });

  it("lista audit logs paginados e filtra por resource", async () => {
    const response = await request(app.getHttpServer())
      .get("/settings/audit-logs?resource=user")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items.every((item: { resource: string }) => item.resource === "user")).toBe(true);
  });

  it("não vaza audit logs de outra organização", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Settings", slug: "other-corp-e2e-settings" })
      .returning();
    await db.insert(schema.auditLogs).values({
      organizationId: otherOrg[0]!.id,
      action: "test.action",
      resource: "test",
    });

    const response = await request(app.getHttpServer())
      .get("/settings/audit-logs?resource=test")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });
});
