import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./_helpers";
import { services } from "./catalog";
import { incidentSeverityEnum, incidentStatusEnum } from "./enums";
import { users } from "./identity";
import { organizations } from "./organizations";

export const incidents = pgTable(
  "incidents",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary"),
    severity: incidentSeverityEnum("severity").notNull().default("sev3"),
    status: incidentStatusEnum("status").notNull().default("investigating"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("incidents_organization_id_idx").on(table.organizationId),
    index("incidents_status_idx").on(table.status),
    index("incidents_severity_idx").on(table.severity),
  ],
);

export const incidentEvents = pgTable(
  "incident_events",
  {
    id: idColumn(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    type: varchar("type", { length: 100 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("incident_events_incident_id_idx").on(table.incidentId)],
);

export const incidentServices = pgTable(
  "incident_services",
  {
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    impact: text("impact"),
  },
  (table) => [primaryKey({ columns: [table.incidentId, table.serviceId] })],
);

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [incidents.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, { fields: [incidents.ownerId], references: [users.id] }),
  events: many(incidentEvents),
  affectedServices: many(incidentServices),
}));

export const incidentEventsRelations = relations(incidentEvents, ({ one }) => ({
  incident: one(incidents, { fields: [incidentEvents.incidentId], references: [incidents.id] }),
  author: one(users, { fields: [incidentEvents.authorId], references: [users.id] }),
}));

export const incidentServicesRelations = relations(incidentServices, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentServices.incidentId],
    references: [incidents.id],
  }),
  service: one(services, { fields: [incidentServices.serviceId], references: [services.id] }),
}));
