import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./_helpers";
import { featureFlagTypeEnum } from "./enums";
import { organizations } from "./organizations";

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }),
    type: featureFlagTypeEnum("type").notNull().default("boolean"),
    enabled: boolean("enabled").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("feature_flags_org_key_idx").on(table.organizationId, table.key)],
);

export const featureFlagRules = pgTable(
  "feature_flag_rules",
  {
    id: idColumn(),
    featureFlagId: uuid("feature_flag_id")
      .notNull()
      .references(() => featureFlags.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 50 }).notNull(),
    value: jsonb("value").notNull(),
    order: integer("order").notNull().default(0),
  },
  (table) => [index("feature_flag_rules_flag_id_idx").on(table.featureFlagId)],
);

export const featureFlagsRelations = relations(featureFlags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [featureFlags.organizationId],
    references: [organizations.id],
  }),
  rules: many(featureFlagRules),
}));

export const featureFlagRulesRelations = relations(featureFlagRules, ({ one }) => ({
  featureFlag: one(featureFlags, {
    fields: [featureFlagRules.featureFlagId],
    references: [featureFlags.id],
  }),
}));
