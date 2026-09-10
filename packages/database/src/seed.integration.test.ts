import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema";
import { seedBaseline, seedUserWithRole } from "./seed";

describe("seedUserWithRole (integração via pglite)", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterAll(async () => {
    await client.close();
  });

  it("cria o usuário com senha hasheada e atribui a role", async () => {
    const { organization } = await seedBaseline(db, "Acme Engineering");

    const { user } = await seedUserWithRole(db, {
      organizationId: organization.id,
      email: "admin@acme.test",
      name: "Admin Demo",
      password: "demo1234",
      roleSlug: "admin",
    });

    expect(user.passwordHash).toBeTruthy();
    expect(user.passwordHash).not.toBe("demo1234");

    const assignedRoles = await db
      .select()
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, user.id));
    expect(assignedRoles).toHaveLength(1);
  });

  it("é idempotente: rodar de novo não duplica usuário nem atribuição de role", async () => {
    const { organization } = await seedBaseline(db, "Acme Engineering");

    await seedUserWithRole(db, {
      organizationId: organization.id,
      email: "admin@acme.test",
      name: "Admin Demo",
      password: "demo1234",
      roleSlug: "admin",
    });
    const { user } = await seedUserWithRole(db, {
      organizationId: organization.id,
      email: "admin@acme.test",
      name: "Admin Demo",
      password: "demo1234",
      roleSlug: "admin",
    });

    const matchingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "admin@acme.test"));
    expect(matchingUsers).toHaveLength(1);

    const assignedRoles = await db
      .select()
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, user.id));
    expect(assignedRoles).toHaveLength(1);
  });
});
