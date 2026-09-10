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

describe("Incidents (e2e)", () => {
  let app: INestApplication;
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let adminCookie: string;
  let paymentsServiceId: string;
  let incidentId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "../../packages/database/drizzle" });
    await seedDemoData(db);

    const paymentsService = await db.query.services.findFirst({
      where: eq(schema.services.slug, "payments-api"),
    });
    paymentsServiceId = paymentsService!.id;

    const existingIncident = await db.query.incidents.findFirst({
      where: eq(schema.incidents.title, "Latência elevada em payments-api"),
    });
    incidentId = existingIncident!.id;

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
    const response = await request(app.getHttpServer()).get("/incidents");
    expect(response.status).toBe(401);
  });

  it("lista incidentes paginados", async () => {
    const response = await request(app.getHttpServer())
      .get("/incidents")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it("filtra por severity", async () => {
    const response = await request(app.getHttpServer())
      .get("/incidents?severity=sev1")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(
      response.body.items.every((item: { severity: string }) => item.severity === "sev1"),
    ).toBe(true);
  });

  it("retorna o detalhe com services, timeline, deployments relacionados e métricas", async () => {
    const response = await request(app.getHttpServer())
      .get(`/incidents/${incidentId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.incident.id).toBe(incidentId);
    expect(Array.isArray(response.body.services)).toBe(true);
    expect(response.body.services.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.relatedDeployments)).toBe(true);
  });

  it("cria um novo incidente vinculado a um serviço", async () => {
    const response = await request(app.getHttpServer())
      .post("/incidents")
      .set("Cookie", adminCookie)
      .send({ title: "Teste e2e de incidente", severity: "sev3", serviceIds: [paymentsServiceId] });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Teste e2e de incidente");
    expect(response.body.status).toBe("investigating");
  });

  it("rejeita criar incidente com serviço de outra organização/inexistente", async () => {
    const response = await request(app.getHttpServer())
      .post("/incidents")
      .set("Cookie", adminCookie)
      .send({
        title: "Incidente inválido",
        severity: "sev3",
        serviceIds: ["00000000-0000-0000-0000-000000000000"],
      });

    expect(response.status).toBe(400);
  });

  it("atualiza status e registra um evento de timeline + audit log", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/incidents/${incidentId}`)
      .set("Cookie", adminCookie)
      .send({ status: "resolved" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("resolved");
    expect(response.body.resolvedAt).toBeTruthy();

    const events = await db
      .select()
      .from(schema.incidentEvents)
      .where(
        and(eq(schema.incidentEvents.incidentId, incidentId), eq(schema.incidentEvents.type, "status_change")),
      );
    expect(events.length).toBeGreaterThan(0);

    const auditRows = await db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.resource, "incident"), eq(schema.auditLogs.action, "incident.update")));
    expect(auditRows.length).toBeGreaterThan(0);
  });

  it("adiciona uma comunicação (evento manual) ao incidente", async () => {
    const response = await request(app.getHttpServer())
      .post(`/incidents/${incidentId}/events`)
      .set("Cookie", adminCookie)
      .send({ message: "Atualização para stakeholders: causa raiz identificada." });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain("causa raiz identificada");
  });

  it("retorna 404 para um incidente inexistente", async () => {
    const response = await request(app.getHttpServer())
      .get("/incidents/00000000-0000-0000-0000-000000000000")
      .set("Cookie", adminCookie);
    expect(response.status).toBe(404);
  });
});
