import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAtOnly, idColumn } from "./_helpers";
import { integrationProviderEnum } from "./enums";
import { organizations } from "./organizations";

export const integrations = pgTable(
  "integrations",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum("provider").notNull(),
    config: jsonb("config").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    ...createdAtOnly,
  },
  (table) => [
    index("integrations_organization_id_idx").on(table.organizationId),
    uniqueIndex("integrations_org_provider_idx").on(table.organizationId, table.provider),
  ],
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    events: jsonb("events").notNull().default([]),
    secretHash: text("secret_hash").notNull(),
    ...createdAtOnly,
  },
  (table) => [index("webhooks_organization_id_idx").on(table.organizationId)],
);

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
}));
