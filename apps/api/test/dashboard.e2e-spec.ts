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

describe("Dashboard (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/dashboard/summary");
    expect(response.status).toBe(401);
  });

  it("retorna KPIs, my services, recent deployments e active incidents", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard/summary")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.kpis.servicesCount).toBe(8);
    expect(response.body.kpis.activeIncidents).toBeGreaterThan(0);
    expect(response.body.kpis.uptimePercentage).toBeGreaterThanOrEqual(0);
    expect(response.body.kpis.sloCompliance).toBeGreaterThanOrEqual(0);

    expect(Array.isArray(response.body.recentDeployments)).toBe(true);
    expect(response.body.recentDeployments.length).toBeGreaterThan(0);

    expect(Array.isArray(response.body.activeIncidents)).toBe(true);
    expect(response.body.activeIncidents.length).toBeGreaterThan(0);

    expect(Array.isArray(response.body.myServices)).toBe(true);
    expect(response.body.myServices.some((service: { name: string }) => service.name === "notifications-worker")).toBe(
      true,
    );
  });
});
