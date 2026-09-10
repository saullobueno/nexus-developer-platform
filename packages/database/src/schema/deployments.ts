import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { idColumn, createdAtOnly } from "./_helpers";
import { environments, services } from "./catalog";
import { deploymentStatusEnum, logLevelEnum } from "./enums";
import { users } from "./identity";

export const deployments = pgTable(
  "deployments",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    version: varchar("version", { length: 100 }).notNull(),
    commitSha: varchar("commit_sha", { length: 40 }),
    commitMessage: text("commit_message"),
    status: deploymentStatusEnum("status").notNull().default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    ...createdAtOnly,
  },
  (table) => [
    index("deployments_service_id_idx").on(table.serviceId),
    index("deployments_environment_id_idx").on(table.environmentId),
    index("deployments_status_idx").on(table.status),
    index("deployments_created_at_idx").on(table.createdAt),
  ],
);

export const deploymentLogs = pgTable(
  "deployment_logs",
  {
    id: idColumn(),
    deploymentId: uuid("deployment_id")
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),
    level: logLevelEnum("level").notNull().default("info"),
    message: text("message").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("deployment_logs_deployment_id_idx").on(table.deploymentId)],
);

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
  service: one(services, { fields: [deployments.serviceId], references: [services.id] }),
  environment: one(environments, {
    fields: [deployments.environmentId],
    references: [environments.id],
  }),
  author: one(users, { fields: [deployments.authorId], references: [users.id] }),
  logs: many(deploymentLogs),
}));

export const deploymentLogsRelations = relations(deploymentLogs, ({ one }) => ({
  deployment: one(deployments, {
    fields: [deploymentLogs.deploymentId],
    references: [deployments.id],
  }),
}));
