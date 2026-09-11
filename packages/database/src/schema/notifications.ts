import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAtOnly, idColumn } from "./_helpers.js";
import { notificationChannelEnum } from "./enums.js";
import { users } from "./identity.js";
import { organizations } from "./organizations.js";

export const notifications = pgTable(
  "notifications",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    read: boolean("read").notNull().default(false),
    ...createdAtOnly,
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_read_idx").on(table.read),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ...createdAtOnly,
  },
  (table) => [
    index("audit_logs_organization_id_idx").on(table.organizationId),
    index("audit_logs_resource_idx").on(table.resource, table.resourceId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));
