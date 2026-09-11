import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idColumn } from "./_helpers.js";
import { environments, services } from "./catalog.js";
import { logLevelEnum } from "./enums.js";

export const metrics = pgTable(
  "metrics",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id").references(() => environments.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 100 }).notNull(),
    value: real("value").notNull(),
    unit: varchar("unit", { length: 50 }),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("metrics_service_id_idx").on(table.serviceId),
    index("metrics_name_idx").on(table.name),
    index("metrics_timestamp_idx").on(table.timestamp),
  ],
);

export const logs = pgTable(
  "logs",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id").references(() => environments.id, {
      onDelete: "cascade",
    }),
    level: logLevelEnum("level").notNull().default("info"),
    message: text("message").notNull(),
    traceId: varchar("trace_id", { length: 64 }),
    metadata: jsonb("metadata"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("logs_service_id_idx").on(table.serviceId),
    index("logs_level_idx").on(table.level),
    index("logs_trace_id_idx").on(table.traceId),
    index("logs_timestamp_idx").on(table.timestamp),
  ],
);

export const traces = pgTable(
  "traces",
  {
    id: idColumn(),
    traceId: varchar("trace_id", { length: 64 }).notNull(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    durationMs: real("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("traces_trace_id_idx").on(table.traceId),
    index("traces_service_id_idx").on(table.serviceId),
  ],
);

export const spans = pgTable(
  "spans",
  {
    id: idColumn(),
    traceId: uuid("trace_id")
      .notNull()
      .references(() => traces.id, { onDelete: "cascade" }),
    parentSpanId: uuid("parent_span_id"),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    durationMs: real("duration_ms").notNull(),
  },
  (table) => [index("spans_trace_id_idx").on(table.traceId)],
);

export const errorEvents = pgTable(
  "error_events",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id").references(() => environments.id, {
      onDelete: "cascade",
    }),
    type: varchar("type", { length: 255 }).notNull(),
    message: text("message").notNull(),
    stackTrace: text("stack_trace"),
    release: varchar("release", { length: 100 }),
    occurrences: integer("occurrences").notNull().default(1),
    affectedUsers: integer("affected_users").notNull().default(0),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("error_events_service_id_idx").on(table.serviceId),
    index("error_events_type_idx").on(table.type),
  ],
);

export const metricsRelations = relations(metrics, ({ one }) => ({
  service: one(services, { fields: [metrics.serviceId], references: [services.id] }),
  environment: one(environments, {
    fields: [metrics.environmentId],
    references: [environments.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  service: one(services, { fields: [logs.serviceId], references: [services.id] }),
  environment: one(environments, { fields: [logs.environmentId], references: [environments.id] }),
}));

export const tracesRelations = relations(traces, ({ one, many }) => ({
  service: one(services, { fields: [traces.serviceId], references: [services.id] }),
  spans: many(spans),
}));

export const spansRelations = relations(spans, ({ one }) => ({
  trace: one(traces, { fields: [spans.traceId], references: [traces.id] }),
  service: one(services, { fields: [spans.serviceId], references: [services.id] }),
}));

export const errorEventsRelations = relations(errorEvents, ({ one }) => ({
  service: one(services, { fields: [errorEvents.serviceId], references: [services.id] }),
  environment: one(environments, {
    fields: [errorEvents.environmentId],
    references: [environments.id],
  }),
}));
