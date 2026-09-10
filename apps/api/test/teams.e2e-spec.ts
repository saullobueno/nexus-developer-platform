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

describe("Teams (e2e)", () => {
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
    const response = await request(app.getHttpServer()).get("/teams");
    expect(response.status).toBe(401);
  });

  it("lista os 6 times com contagem de membros e serviços", async () => {
    const response = await request(app.getHttpServer()).get("/teams").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(6);
    expect(response.body.items[0]).toHaveProperty("memberCount");
    expect(response.body.items[0]).toHaveProperty("serviceCount");
  });

  it("retorna o detalhe completo de um time com KPIs", async () => {
    const response = await request(app.getHttpServer()).get("/teams/payments").set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.team.name).toBe("Payments");
    expect(response.body.services.some((service: { slug: string }) => service.slug === "payments-api")).toBe(
      true,
    );
    expect(Array.isArray(response.body.members)).toBe(true);
    expect(Array.isArray(response.body.deployments)).toBe(true);
    expect(response.body.deployments.length).toBeGreaterThan(0);
    expect(response.body.kpis.servicesCount).toBeGreaterThan(0);
    expect(response.body.kpis.deploymentsCount30d).toBeGreaterThan(0);
  });

  it("retorna 404 para um time inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/teams/does-not-exist")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });

  it("não vaza um time de outra organização (object-level authorization)", async () => {
    const otherOrg = await db
      .insert(schema.organizations)
      .values({ name: "Other Corp E2E Teams", slug: "other-corp-e2e-teams" })
      .returning();
    await db.insert(schema.teams).values({
      organizationId: otherOrg[0]!.id,
      name: "Other Team",
      slug: "other-team-e2e",
    });

    const response = await request(app.getHttpServer())
      .get("/teams/other-team-e2e")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
