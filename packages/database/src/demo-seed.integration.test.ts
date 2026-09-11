import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SERVICES, TEAMS } from "./demo/data.js";
import { seedDemoData } from "./demo-seed.js";
import * as schema from "./schema/index.js";

describe("seedDemoData (integração via pglite)", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./drizzle" });
    await seedDemoData(db);
  });

  afterAll(async () => {
    await client.close();
  });

  it("cria os 6 times e os 8 services da spec", async () => {
    const teams = await db.select().from(schema.teams);
    const services = await db.select().from(schema.services);

    expect(teams).toHaveLength(TEAMS.length);
    expect(services).toHaveLength(SERVICES.length);
    expect(services.map((service) => service.name).sort()).toEqual(
      SERVICES.map((service) => service.name).sort(),
    );
  });

  it("cria usuários demo com senha hasheada e roles atribuídas", async () => {
    const users = await db.select().from(schema.users);
    const userRoles = await db.select().from(schema.userRoles);

    expect(users.length).toBeGreaterThan(0);
    expect(userRoles.length).toBeGreaterThan(0);
    for (const user of users) {
      expect(user.passwordHash).toBeTruthy();
    }
  });

  it("cria deployments, pipeline runs e stages para cada service", async () => {
    const deployments = await db.select().from(schema.deployments);
    const pipelineRuns = await db.select().from(schema.pipelineRuns);
    const pipelineStages = await db.select().from(schema.pipelineStages);

    expect(deployments.length).toBe(SERVICES.length * 6);
    expect(pipelineRuns.length).toBe(deployments.length);
    expect(pipelineStages.length).toBe(pipelineRuns.length * 5);
  });

  it("cria incidentes com eventos de timeline e serviço afetado", async () => {
    const incidents = await db.select().from(schema.incidents);
    const incidentEvents = await db.select().from(schema.incidentEvents);
    const incidentServices = await db.select().from(schema.incidentServices);

    expect(incidents.length).toBeGreaterThan(0);
    expect(incidentEvents.length).toBeGreaterThan(0);
    expect(incidentServices.length).toBe(incidents.length);
  });

  it("cria métricas, logs, traces/spans e error events", async () => {
    const metrics = await db.select().from(schema.metrics);
    const logs = await db.select().from(schema.logs);
    const traces = await db.select().from(schema.traces);
    const spans = await db.select().from(schema.spans);
    const errorEvents = await db.select().from(schema.errorEvents);

    expect(metrics.length).toBeGreaterThan(0);
    expect(logs.length).toBeGreaterThan(0);
    // 1 trace cross-service (checkout-web -> customer-api -> payments-api) + 1 trace
    // por cada um dos demais services.
    expect(traces.length).toBe(SERVICES.length - 2);
    expect(spans.length).toBeGreaterThan(0);
    expect(errorEvents.length).toBeGreaterThan(0);
  });

  it("cria apis com endpoints, documentos, adrs e feature flags", async () => {
    const apis = await db.select().from(schema.apis);
    const apiEndpoints = await db.select().from(schema.apiEndpoints);
    const documents = await db.select().from(schema.documents);
    const adrs = await db.select().from(schema.adrs);
    const featureFlags = await db.select().from(schema.featureFlags);
    const featureFlagRules = await db.select().from(schema.featureFlagRules);

    expect(apis.length).toBeGreaterThan(0);
    expect(apiEndpoints.length).toBeGreaterThan(0);
    expect(documents.length).toBeGreaterThan(0);
    expect(adrs.length).toBeGreaterThan(0);
    expect(featureFlags.length).toBeGreaterThan(0);
    expect(featureFlagRules.length).toBeGreaterThan(0);
  });
});
