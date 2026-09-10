import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./_helpers";
import { services } from "./catalog";
import { adrStatusEnum, documentCategoryEnum } from "./enums";
import { users } from "./identity";
import { organizations } from "./organizations";

export const documents = pgTable(
  "documents",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    category: documentCategoryEnum("category").notNull(),
    content: text("content").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("documents_org_slug_idx").on(table.organizationId, table.slug),
    index("documents_category_idx").on(table.category),
    index("documents_service_id_idx").on(table.serviceId),
  ],
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: idColumn(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("document_versions_document_id_idx").on(table.documentId)],
);

export const adrs = pgTable(
  "adrs",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    status: adrStatusEnum("status").notNull().default("proposed"),
    context: text("context"),
    decision: text("decision"),
    consequences: text("consequences"),
    alternatives: text("alternatives"),
    ...timestamps,
  },
  (table) => [index("adrs_organization_id_idx").on(table.organizationId)],
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  author: one(users, { fields: [documents.authorId], references: [users.id] }),
  service: one(services, { fields: [documents.serviceId], references: [services.id] }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, { fields: [documentVersions.documentId], references: [documents.id] }),
  author: one(users, { fields: [documentVersions.authorId], references: [users.id] }),
}));
