import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAtOnly, idColumn } from "./_helpers.js";
import { services } from "./catalog.js";
import { apiProtocolEnum, apiStatusEnum } from "./enums.js";
import { teams } from "./identity.js";
import { organizations } from "./organizations.js";

export const apis = pgTable(
  "apis",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
    status: apiStatusEnum("status").notNull().default("active"),
    protocol: apiProtocolEnum("protocol").notNull().default("rest"),
    description: text("description"),
    ...createdAtOnly,
  },
  (table) => [
    uniqueIndex("apis_slug_idx").on(table.slug),
    index("apis_organization_id_idx").on(table.organizationId),
  ],
);

export const apiEndpoints = pgTable(
  "api_endpoints",
  {
    id: idColumn(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    method: varchar("method", { length: 10 }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    description: text("description"),
    requestSchema: jsonb("request_schema"),
    responseSchema: jsonb("response_schema"),
  },
  (table) => [index("api_endpoints_api_id_idx").on(table.apiId)],
);

export const apiConsumers = pgTable(
  "api_consumers",
  {
    id: idColumn(),
    apiId: uuid("api_id")
      .notNull()
      .references(() => apis.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    consumerServiceId: uuid("consumer_service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    ...createdAtOnly,
  },
  (table) => [index("api_consumers_api_id_idx").on(table.apiId)],
);

export const apisRelations = relations(apis, ({ one, many }) => ({
  organization: one(organizations, { fields: [apis.organizationId], references: [organizations.id] }),
  service: one(services, { fields: [apis.serviceId], references: [services.id] }),
  team: one(teams, { fields: [apis.teamId], references: [teams.id] }),
  endpoints: many(apiEndpoints),
  consumers: many(apiConsumers),
}));

export const apiEndpointsRelations = relations(apiEndpoints, ({ one }) => ({
  api: one(apis, { fields: [apiEndpoints.apiId], references: [apis.id] }),
}));

export const apiConsumersRelations = relations(apiConsumers, ({ one }) => ({
  api: one(apis, { fields: [apiConsumers.apiId], references: [apis.id] }),
  consumerService: one(services, {
    fields: [apiConsumers.consumerServiceId],
    references: [services.id],
  }),
}));
