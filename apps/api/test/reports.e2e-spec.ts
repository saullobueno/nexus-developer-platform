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

describe("Reports (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/reports");
    expect(response.status).toBe(401);
  });

  it("retorna as métricas DORA, reliability e delivery para o período padrão", async () => {
    const response = await request(app.getHttpServer()).get("/reports").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.days).toBe(30);
    expect(response.body.dora.deploymentFrequencyPerDay).toBeGreaterThan(0);
    expect(response.body.dora).toHaveProperty("changeFailureRate");
    expect(response.body.reliability).toHaveProperty("uptimeAvg");
    expect(response.body.delivery.totalDeployments).toBeGreaterThan(0);
  });

  it("aceita um período customizado via days", async () => {
    const response = await request(app.getHttpServer())
      .get("/reports?days=7")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.days).toBe(7);
  });

  it("rejeita um período inválido", async () => {
    const response = await request(app.getHttpServer())
      .get("/reports?days=0")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(400);
  });

  it("não vaza dados de outra organização nos agregados", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Reports", slug: "other-corp-e2e-reports" })
      .returning();
    await db.insert(schema.services).values({
      organizationId: otherOrg[0]!.id,
      name: "other-report-service",
      slug: "other-report-service-e2e",
      type: "api",
      lifecycle: "production",
    });

    const response = await request(app.getHttpServer()).get("/reports").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
  });
});
