import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { DatabaseClient } from "./client";
import { slugify } from "./lib/slugify";
import { organizations, permissions, rolePermissions, roles, userRoles, users } from "./schema";

export const BASELINE_PERMISSIONS = [
  "services:read",
  "services:create",
  "services:update",
  "services:delete",
  "deployments:read",
  "deployments:create",
  "deployments:rollback",
  "incidents:read",
  "incidents:create",
  "incidents:update",
  "apis:read",
  "docs:read",
  "settings:read",
  "settings:update",
] as const;

export type BaselinePermission = (typeof BASELINE_PERMISSIONS)[number];

export const BASELINE_ROLES = [
  { name: "Admin", slug: "admin" },
  { name: "Platform Engineer", slug: "platform-engineer" },
  { name: "Tech Lead", slug: "tech-lead" },
  { name: "Developer", slug: "developer" },
  { name: "Viewer", slug: "viewer" },
] as const;

export type BaselineRoleSlug = (typeof BASELINE_ROLES)[number]["slug"];

export const ROLE_PERMISSION_MAP: Record<BaselineRoleSlug, readonly BaselinePermission[]> = {
  admin: BASELINE_PERMISSIONS,
  "platform-engineer": BASELINE_PERMISSIONS,
  "tech-lead": [
    "services:read",
    "services:update",
    "deployments:read",
    "deployments:create",
    "deployments:rollback",
    "incidents:read",
    "incidents:create",
    "incidents:update",
    "apis:read",
    "docs:read",
    "settings:read",
  ],
  developer: [
    "services:read",
    "deployments:read",
    "deployments:create",
    "incidents:read",
    "incidents:create",
    "apis:read",
    "docs:read",
  ],
  viewer: ["services:read", "deployments:read", "incidents:read", "apis:read", "docs:read", "settings:read"],
};

export async function seedBaseline(db: DatabaseClient, organizationName = "Acme Engineering") {
  const organizationSlug = slugify(organizationName);

  await db
    .insert(organizations)
    .values({ name: organizationName, slug: organizationSlug })
    .onConflictDoNothing({ target: organizations.slug });

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, organizationSlug),
  });
  if (!organization) {
    throw new Error(`Falha ao criar/encontrar a organização "${organizationName}"`);
  }

  await db
    .insert(permissions)
    .values(BASELINE_PERMISSIONS.map((key) => ({ key })))
    .onConflictDoNothing({ target: permissions.key });

  const allPermissions = await db.select().from(permissions);
  const permissionIdByKey = new Map(allPermissions.map((permission) => [permission.key, permission.id]));

  await db
    .insert(roles)
    .values(BASELINE_ROLES.map((role) => ({ name: role.name, slug: role.slug, isSystem: true })))
    .onConflictDoNothing({ target: roles.slug });

  const allRoles = await db.select().from(roles);
  const roleIdBySlug = new Map(allRoles.map((role) => [role.slug, role.id]));

  for (const role of BASELINE_ROLES) {
    const roleId = roleIdBySlug.get(role.slug);
    if (!roleId) continue;

    for (const permissionKey of ROLE_PERMISSION_MAP[role.slug]) {
      const permissionId = permissionIdByKey.get(permissionKey);
      if (!permissionId) continue;

      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing({ target: [rolePermissions.roleId, rolePermissions.permissionId] });
    }
  }

  return { organization };
}

export interface SeedUserInput {
  organizationId: string;
  email: string;
  name: string;
  password: string;
  roleSlug: BaselineRoleSlug;
}

export async function seedUserWithRole(db: DatabaseClient, input: SeedUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  await db
    .insert(users)
    .values({
      organizationId: input.organizationId,
      email: input.email,
      name: input.name,
      passwordHash,
    })
    .onConflictDoNothing({ target: users.email });

  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (!user) {
    throw new Error(`Falha ao criar/encontrar o usuário "${input.email}"`);
  }

  const role = await db.query.roles.findFirst({ where: eq(roles.slug, input.roleSlug) });
  if (!role) {
    throw new Error(`Role "${input.roleSlug}" não encontrada — rode seedBaseline() antes`);
  }

  await db
    .insert(userRoles)
    .values({ userId: user.id, roleId: role.id })
    .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });

  return { user };
}
