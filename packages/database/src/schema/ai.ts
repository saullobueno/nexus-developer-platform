import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idColumn } from "./_helpers";
import { aiMessageRoleEnum, aiRunStatusEnum } from "./enums";
import { users } from "./identity";
import { organizations } from "./organizations";

export const aiAgentRuns = pgTable(
  "ai_agent_runs",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    promptVersion: varchar("prompt_version", { length: 50 }),
    model: varchar("model", { length: 100 }).notNull(),
    status: aiRunStatusEnum("status").notNull().default("running"),
    summary: text("summary"),
    confidence: real("confidence"),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    tokensInput: integer("tokens_input").notNull().default(0),
    tokensOutput: integer("tokens_output").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }).notNull().default("0"),
  },
  (table) => [
    index("ai_agent_runs_organization_id_idx").on(table.organizationId),
    index("ai_agent_runs_status_idx").on(table.status),
  ],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: idColumn(),
    runId: uuid("run_id")
      .notNull()
      .references(() => aiAgentRuns.id, { onDelete: "cascade" }),
    role: aiMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_messages_run_id_idx").on(table.runId)],
);

export const aiToolCalls = pgTable(
  "ai_tool_calls",
  {
    id: idColumn(),
    runId: uuid("run_id")
      .notNull()
      .references(() => aiAgentRuns.id, { onDelete: "cascade" }),
    toolName: varchar("tool_name", { length: 100 }).notNull(),
    input: jsonb("input"),
    output: jsonb("output"),
    isMutating: boolean("is_mutating").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_tool_calls_run_id_idx").on(table.runId)],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    tokensInput: integer("tokens_input").notNull().default(0),
    tokensOutput: integer("tokens_output").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }).notNull().default("0"),
    requestCount: integer("request_count").notNull().default(0),
  },
  (table) => [index("ai_usage_organization_id_idx").on(table.organizationId, table.date)],
);

export const aiAgentRunsRelations = relations(aiAgentRuns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiAgentRuns.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [aiAgentRuns.userId], references: [users.id] }),
  approvedBy: one(users, { fields: [aiAgentRuns.approvedById], references: [users.id] }),
  messages: many(aiMessages),
  toolCalls: many(aiToolCalls),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  run: one(aiAgentRuns, { fields: [aiMessages.runId], references: [aiAgentRuns.id] }),
}));

export const aiToolCallsRelations = relations(aiToolCalls, ({ one }) => ({
  run: one(aiAgentRuns, { fields: [aiToolCalls.runId], references: [aiAgentRuns.id] }),
}));
