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

describe("Apis (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/apis");
    expect(response.status).toBe(401);
  });

  it("lista as APIs paginadas", async () => {
    const response = await request(app.getHttpServer()).get("/apis").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("protocol");
  });

  it("filtra por protocol", async () => {
    const response = await request(app.getHttpServer())
      .get("/apis?protocol=graphql")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].name).toBe("identity-api");
  });

  it("filtra por status", async () => {
    const response = await request(app.getHttpServer())
      .get("/apis?status=deprecated")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.items.every((item: { status: string }) => item.status === "deprecated")).toBe(true);
  });

  it("filtra por busca (search)", async () => {
    const response = await request(app.getHttpServer())
      .get("/apis?search=payments")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].name).toBe("payments-api");
  });

  it("rejeita filtros inválidos de paginação", async () => {
    const response = await request(app.getHttpServer()).get("/apis?page=0").set("Cookie", adminCookie);
    expect(response.status).toBe(400);
  });

  it("retorna o detalhe completo de uma API por slug", async () => {
    const response = await request(app.getHttpServer())
      .get("/apis/payments-api")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.api.name).toBe("payments-api");
    expect(response.body.service?.name).toBe("payments-api");
    expect(Array.isArray(response.body.endpoints)).toBe(true);
    expect(response.body.endpoints.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.consumers)).toBe(true);
    expect(response.body.consumers.some((consumer: { name: string }) => consumer.name === "checkout-web")).toBe(
      true,
    );
    expect(Array.isArray(response.body.documents)).toBe(true);
    expect(response.body.documents.length).toBeGreaterThan(0);
  });

  it("retorna 404 para um slug inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/apis/does-not-exist")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("não vaza uma API de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Apis", slug: "other-corp-e2e-apis" })
      .returning();
    await db.insert(schema.apis).values({
      organizationId: otherOrg[0]!.id,
      name: "other-org-api",
      slug: "other-org-api-e2e",
      version: "1.0.0",
      status: "active",
      protocol: "rest",
    });

    const response = await request(app.getHttpServer())
      .get("/apis/other-org-api-e2e")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
