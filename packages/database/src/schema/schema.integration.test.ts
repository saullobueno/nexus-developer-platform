import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASELINE_ROLES, seedBaseline } from "../seed";
import * as schema from "./index";

describe("schema (integração via pglite)", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterAll(async () => {
    await client.close();
  });

  it("aplica as migrations e faz seed de organização, roles e permissions", async () => {
    const { organization } = await seedBaseline(db, "Acme Engineering");
    expect(organization.slug).toBe("acme-engineering");

    const roles = await db.select().from(schema.roles);
    expect(roles).toHaveLength(BASELINE_ROLES.length);

    const permissions = await db.select().from(schema.permissions);
    expect(permissions.length).toBeGreaterThan(0);
  });

  it("cria um time e um serviço vinculado, e consegue navegar a relation", async () => {
    const organizations = await db.select().from(schema.organizations).limit(1);
    const organization = organizations[0];
    expect(organization).toBeDefined();
    if (!organization) return;

    const insertedTeams = await db
      .insert(schema.teams)
      .values({ organizationId: organization.id, name: "Payments", slug: "payments" })
      .returning();
    const team = insertedTeams[0];
    expect(team).toBeDefined();
    if (!team) return;

    const insertedServices = await db
      .insert(schema.services)
      .values({
        organizationId: organization.id,
        teamId: team.id,
        name: "payments-api",
        slug: "payments-api",
        type: "api",
        lifecycle: "production",
      })
      .returning();
    const service = insertedServices[0];
    expect(service).toBeDefined();
    if (!service) return;

    const found = await db.query.services.findFirst({
      where: eq(schema.services.id, service.id),
      with: { team: true },
    });

    expect(found?.team?.slug).toBe("payments");
  });

  it("registra deployment e incidente vinculados ao serviço", async () => {
    const organizations = await db.select().from(schema.organizations).limit(1);
    const organization = organizations[0];
    const services = await db.select().from(schema.services).limit(1);
    const service = services[0];
    expect(organization).toBeDefined();
    expect(service).toBeDefined();
    if (!organization || !service) return;

    const insertedEnvironments = await db
      .insert(schema.environments)
      .values({
        organizationId: organization.id,
        name: "Production",
        slug: "production",
        type: "production",
      })
      .returning();
    const environment = insertedEnvironments[0];
    expect(environment).toBeDefined();
    if (!environment) return;

    const insertedDeployments = await db
      .insert(schema.deployments)
      .values({
        serviceId: service.id,
        environmentId: environment.id,
        version: "1.0.0",
        status: "successful",
      })
      .returning();
    const deployment = insertedDeployments[0];
    expect(deployment?.status).toBe("successful");

    const insertedIncidents = await db
      .insert(schema.incidents)
      .values({
        organizationId: organization.id,
        title: "Latência elevada em payments-api",
        severity: "sev2",
      })
      .returning();
    const incident = insertedIncidents[0];
    expect(incident).toBeDefined();
    if (!incident) return;

    await db
      .insert(schema.incidentServices)
      .values({ incidentId: incident.id, serviceId: service.id });

    const relatedServices = await db
      .select()
      .from(schema.incidentServices)
      .where(eq(schema.incidentServices.incidentId, incident.id));

    expect(relatedServices).toHaveLength(1);
  });
});
