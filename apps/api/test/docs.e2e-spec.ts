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

describe("Docs (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/docs");
    expect(response.status).toBe(401);
  });

  it("lista os documentos paginados", async () => {
    const response = await request(app.getHttpServer()).get("/docs").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty("category");
  });

  it("filtra documentos por category", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs?category=runbooks")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.items.every((item: { category: string }) => item.category === "runbooks")).toBe(true);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("retorna o detalhe de um documento com autor e serviço vinculado", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs/arquitetura-de-pagamentos")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.document.title).toBe("Arquitetura de Pagamentos");
    expect(response.body.author?.name).toBeTruthy();
    expect(response.body.service?.name).toBe("payments-api");
  });

  it("retorna 404 para um documento inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs/does-not-exist")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("lista ADRs paginadas e filtra por status", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs/adrs?status=proposed")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items.every((item: { status: string }) => item.status === "proposed")).toBe(true);
  });

  it("retorna o detalhe de uma ADR", async () => {
    const listResponse = await request(app.getHttpServer()).get("/docs/adrs").set("Cookie", adminCookie);
    const adrId = listResponse.body.items[0].id;

    const response = await request(app.getHttpServer())
      .get(`/docs/adrs/${adrId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("decision");
    expect(response.body).toHaveProperty("alternatives");
  });

  it("não vaza um documento de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Docs", slug: "other-corp-e2e-docs" })
      .returning();
    await db.insert(schema.documents).values({
      organizationId: otherOrg[0]!.id,
      title: "Other Org Doc",
      slug: "other-org-doc-e2e",
      category: "architecture",
      content: "conteúdo de outra organização",
    });

    const response = await request(app.getHttpServer())
      .get("/docs/other-org-doc-e2e")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
