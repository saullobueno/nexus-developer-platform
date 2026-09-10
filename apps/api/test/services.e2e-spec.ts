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

describe("Services (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/services");
    expect(response.status).toBe(401);
  });

  it("lista os 8 services paginados", async () => {
    const response = await request(app.getHttpServer()).get("/services").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(8);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("health");
  });

  it("filtra por busca (search)", async () => {
    const response = await request(app.getHttpServer())
      .get("/services?search=payments")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].name).toBe("payments-api");
  });

  it("filtra por lifecycle", async () => {
    const response = await request(app.getHttpServer())
      .get("/services?lifecycle=development")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.items.every((item: { lifecycle: string }) => item.lifecycle === "development")).toBe(
      true,
    );
  });

  it("rejeita filtros inválidos de paginação", async () => {
    const response = await request(app.getHttpServer())
      .get("/services?page=0")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(400);
  });

  it("retorna o detalhe completo de um serviço por slug", async () => {
    const response = await request(app.getHttpServer())
      .get("/services/payments-api")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.service.name).toBe("payments-api");
    expect(response.body.team?.name).toBe("Payments");
    expect(Array.isArray(response.body.environments)).toBe(true);
    expect(response.body.environments.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.recentDeployments)).toBe(true);
    expect(response.body.recentDeployments.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.dependencies)).toBe(true);
    expect(response.body.dependencies.some((dependency: { name: string }) => dependency.name === "Stripe")).toBe(
      true,
    );
  });

  it("retorna 404 para um slug inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/services/does-not-exist")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
