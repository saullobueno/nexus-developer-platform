import { PGlite } from "@electric-sql/pglite";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import * as schema from "@nexus/database";
import { seedBaseline, seedUserWithRole } from "@nexus/database";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/database/database.constants";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let otherOrgUserId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });

    const { organization } = await seedBaseline(db, "Acme Engineering");
    await seedUserWithRole(db, {
      organizationId: organization.id,
      email: "admin@acme.test",
      name: "Admin Demo",
      password: "demo1234",
      roleSlug: "admin",
    });

    const { organization: otherOrg } = await seedBaseline(db, "Other Corp");
    const { user: otherUser } = await seedUserWithRole(db, {
      organizationId: otherOrg.id,
      email: "other@corp.test",
      name: "Other User",
      password: "irrelevant-password",
      roleSlug: "viewer",
    });
    otherOrgUserId = otherUser.id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  async function loginAsAdmin() {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@acme.test", password: "demo1234" });
    const cookie = response.headers["set-cookie"];
    return { response, cookie: Array.isArray(cookie) ? cookie[0] : cookie };
  }

  it("rejeita login com credenciais inválidas", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@acme.test", password: "wrong-password" });

    expect(response.status).toBe(401);
  });

  it("rejeita login com payload inválido (validação Zod)", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "not-an-email", password: "" });

    expect(response.status).toBe(400);
  });

  it("faz login e retorna um cookie httpOnly com o JWT", async () => {
    const { response, cookie } = await loginAsAdmin();

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("admin@acme.test");
    expect(cookie).toMatch(/nexus_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("nega acesso a /auth/me sem cookie", async () => {
    const response = await request(app.getHttpServer()).get("/auth/me");
    expect(response.status).toBe(401);
  });

  it("permite acesso a /auth/me com cookie válido", async () => {
    const { cookie } = await loginAsAdmin();

    const response = await request(app.getHttpServer()).get("/auth/me").set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("admin@acme.test");
  });

  it("permite /auth/admin-check para quem tem a permissão settings:read", async () => {
    const { cookie } = await loginAsAdmin();

    const response = await request(app.getHttpServer())
      .get("/auth/admin-check")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("nega acesso a /auth/users/:id quando o alvo pertence a outra organização (object-level authorization)", async () => {
    const { cookie } = await loginAsAdmin();

    const response = await request(app.getHttpServer())
      .get(`/auth/users/${otherOrgUserId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(403);
  });

  it("aplica rate limiting mais restrito em /auth/login para mitigar brute-force", async () => {
    let sawTooManyRequests = false;
    for (let attempt = 0; attempt < 30 && !sawTooManyRequests; attempt++) {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "admin@acme.test", password: "wrong-password" });
      if (response.status === 429) {
        sawTooManyRequests = true;
      }
    }
    expect(sawTooManyRequests).toBe(true);
  });
});
