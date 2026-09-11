import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./_helpers.js";
import { environmentTypeEnum, healthStatusEnum, lifecycleEnum, serviceTypeEnum } from "./enums.js";
import { teams, users } from "./identity.js";
import { organizations } from "./organizations.js";

export const environments = pgTable(
  "environments",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    type: environmentTypeEnum("type").notNull(),
    url: text("url"),
    ...timestamps,
  },
  (table) => [uniqueIndex("environments_org_slug_idx").on(table.organizationId, table.slug)],
);

export const services = pgTable(
  "services",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    type: serviceTypeEnum("type").notNull().default("service"),
    lifecycle: lifecycleEnum("lifecycle").notNull().default("development"),
    language: varchar("language", { length: 100 }),
    framework: varchar("framework", { length: 100 }),
    runtime: varchar("runtime", { length: 100 }),
    repositoryUrl: text("repository_url"),
    docsUrl: text("docs_url"),
    runbookUrl: text("runbook_url"),
    dashboardUrl: text("dashboard_url"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("services_slug_idx").on(table.slug),
    index("services_organization_id_idx").on(table.organizationId),
    index("services_team_id_idx").on(table.teamId),
    index("services_lifecycle_idx").on(table.lifecycle),
  ],
);

export const serviceOwners = pgTable(
  "service_owners",
  {
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.serviceId, table.userId] })],
);

export const serviceDependencies = pgTable(
  "service_dependencies",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    dependsOnServiceId: uuid("depends_on_service_id").references(() => services.id, {
      onDelete: "cascade",
    }),
    externalName: varchar("external_name", { length: 255 }),
    ...timestamps,
  },
  (table) => [index("service_dependencies_service_id_idx").on(table.serviceId)],
);

export const serviceEnvironments = pgTable(
  "service_environments",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    version: varchar("version", { length: 100 }),
    health: healthStatusEnum("health").notNull().default("unknown"),
    replicas: integer("replicas").notNull().default(1),
    cpuUsage: real("cpu_usage"),
    memoryUsage: real("memory_usage"),
    latencyMs: real("latency_ms"),
    errorRate: real("error_rate"),
    lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("service_environments_service_env_idx").on(table.serviceId, table.environmentId),
    index("service_environments_environment_id_idx").on(table.environmentId),
  ],
);

export const servicesRelations = relations(services, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [services.organizationId],
    references: [organizations.id],
  }),
  team: one(teams, { fields: [services.teamId], references: [teams.id] }),
  owners: many(serviceOwners),
  dependencies: many(serviceDependencies, { relationName: "serviceDependencies" }),
  environments: many(serviceEnvironments),
}));

export const serviceOwnersRelations = relations(serviceOwners, ({ one }) => ({
  service: one(services, { fields: [serviceOwners.serviceId], references: [services.id] }),
  user: one(users, { fields: [serviceOwners.userId], references: [users.id] }),
}));

export const serviceDependenciesRelations = relations(serviceDependencies, ({ one }) => ({
  service: one(services, {
    fields: [serviceDependencies.serviceId],
    references: [services.id],
    relationName: "serviceDependencies",
  }),
  dependsOn: one(services, {
    fields: [serviceDependencies.dependsOnServiceId],
    references: [services.id],
  }),
}));

export const serviceEnvironmentsRelations = relations(serviceEnvironments, ({ one }) => ({
  service: one(services, {
    fields: [serviceEnvironments.serviceId],
    references: [services.id],
  }),
  environment: one(environments, {
    fields: [serviceEnvironments.environmentId],
    references: [environments.id],
  }),
}));

export const environmentsRelations = relations(environments, ({ many }) => ({
  serviceEnvironments: many(serviceEnvironments),
}));
