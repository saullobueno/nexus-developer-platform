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

describe("Feature Flags (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let developerCookie: string;

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

    const adminLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@acme.test", password: "demo1234" });
    const adminSetCookie = adminLogin.headers["set-cookie"];
    adminCookie = Array.isArray(adminSetCookie) ? adminSetCookie[0]! : adminSetCookie;

    const developerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "bruno.alves@acme.test", password: "demo1234" });
    const developerSetCookie = developerLogin.headers["set-cookie"];
    developerCookie = Array.isArray(developerSetCookie) ? developerSetCookie[0]! : developerSetCookie;
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it("nega acesso sem autenticação", async () => {
    const response = await request(app.getHttpServer()).get("/feature-flags");
    expect(response.status).toBe(401);
  });

  it("lista as feature flags paginadas", async () => {
    const response = await request(app.getHttpServer()).get("/feature-flags").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("enabled");
  });

  it("filtra por type", async () => {
    const response = await request(app.getHttpServer())
      .get("/feature-flags?type=rule_based")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].key).toBe("advanced-search");
  });

  it("retorna o detalhe com as regras ordenadas", async () => {
    const response = await request(app.getHttpServer())
      .get("/feature-flags/advanced-search")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.flag.key).toBe("advanced-search");
    expect(response.body.rules).toHaveLength(3);
    expect(response.body.rules[0].value).toMatchObject({ segment: "enterprise", percentage: 100 });
    expect(Array.isArray(response.body.activity)).toBe(true);
  });

  it("retorna 404 para uma flag inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/feature-flags/does-not-exist")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("nega toggle para quem não tem feature_flags:update", async () => {
    const response = await request(app.getHttpServer())
      .patch("/feature-flags/maintenance-banner/toggle")
      .set("Cookie", developerCookie);
    expect(response.status).toBe(403);
  });

  it("alterna o enabled da flag e registra audit log", async () => {
    const before = await db.query.featureFlags.findFirst({
      where: eq(schema.featureFlags.key, "maintenance-banner"),
    });

    const response = await request(app.getHttpServer())
      .patch("/feature-flags/maintenance-banner/toggle")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.enabled).toBe(!before!.enabled);

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(eq(schema.auditLogs.resource, "feature_flag"), eq(schema.auditLogs.resourceId, before!.id)),
      );
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("substitui as regras da flag e registra audit log", async () => {
    const flag = await db.query.featureFlags.findFirst({
      where: eq(schema.featureFlags.key, "new-checkout-flow"),
    });

    const response = await request(app.getHttpServer())
      .put("/feature-flags/new-checkout-flow/rules")
      .set("Cookie", adminCookie)
      .send({ rules: [{ kind: "percentage", value: { percentage: 80 } }] });

    expect(response.status).toBe(200);
    expect(response.body.rules).toHaveLength(1);
    expect(response.body.rules[0].value).toMatchObject({ percentage: 80 });

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.resource, "feature_flag"),
          eq(schema.auditLogs.resourceId, flag!.id),
          eq(schema.auditLogs.action, "feature_flag.update_rules"),
        ),
      );
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("rejeita um payload de rules inválido", async () => {
    const response = await request(app.getHttpServer())
      .put("/feature-flags/new-checkout-flow/rules")
      .set("Cookie", adminCookie)
      .send({ rules: [{ kind: "" }] });
    expect(response.status).toBe(400);
  });

  it("não vaza uma feature flag de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Flags", slug: "other-corp-e2e-flags" })
      .returning();
    await db.insert(schema.featureFlags).values({
      organizationId: otherOrg[0]!.id,
      key: "other-org-flag",
      name: "Other org flag",
      type: "boolean",
      enabled: false,
    });

    const response = await request(app.getHttpServer())
      .get("/feature-flags/other-org-flag")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
