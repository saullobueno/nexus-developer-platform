import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAtOnly, idColumn } from "./_helpers.js";
import { services } from "./catalog.js";
import { deployments } from "./deployments.js";
import { deploymentStatusEnum, pipelineStageStatusEnum } from "./enums.js";
import { users } from "./identity.js";

export const pipelines = pgTable(
  "pipelines",
  {
    id: idColumn(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    ...createdAtOnly,
  },
  (table) => [index("pipelines_service_id_idx").on(table.serviceId)],
);

export const pipelineRuns = pgTable(
  "pipeline_runs",
  {
    id: idColumn(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    deploymentId: uuid("deployment_id").references(() => deployments.id, {
      onDelete: "set null",
    }),
    triggeredById: uuid("triggered_by_id").references(() => users.id, { onDelete: "set null" }),
    status: deploymentStatusEnum("status").notNull().default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...createdAtOnly,
  },
  (table) => [
    index("pipeline_runs_pipeline_id_idx").on(table.pipelineId),
    index("pipeline_runs_status_idx").on(table.status),
  ],
);

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: idColumn(),
    pipelineRunId: uuid("pipeline_run_id")
      .notNull()
      .references(() => pipelineRuns.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    order: integer("order").notNull(),
    status: pipelineStageStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    logs: text("logs"),
  },
  (table) => [index("pipeline_stages_pipeline_run_id_idx").on(table.pipelineRunId)],
);

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  service: one(services, { fields: [pipelines.serviceId], references: [services.id] }),
  runs: many(pipelineRuns),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [pipelineRuns.pipelineId], references: [pipelines.id] }),
  deployment: one(deployments, {
    fields: [pipelineRuns.deploymentId],
    references: [deployments.id],
  }),
  triggeredBy: one(users, { fields: [pipelineRuns.triggeredById], references: [users.id] }),
  stages: many(pipelineStages),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ one }) => ({
  pipelineRun: one(pipelineRuns, {
    fields: [pipelineStages.pipelineRunId],
    references: [pipelineRuns.id],
  }),
}));
