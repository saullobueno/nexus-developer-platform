import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { idColumn, timestamps } from "./_helpers";

export const organizations = pgTable("organizations", {
  id: idColumn(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
  ...timestamps,
});
