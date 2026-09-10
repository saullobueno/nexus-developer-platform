import { randomUUID } from "node:crypto";
import { timestamp, uuid } from "drizzle-orm/pg-core";

export const idColumn = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const createdAtOnly = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};
