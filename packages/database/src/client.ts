import { drizzle } from "drizzle-orm/postgres-js";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseEnv } from "./env";
import * as schema from "./schema";

export function createDatabaseClient(source?: Record<string, string | undefined>) {
  const env = parseEnv(source);
  const queryClient = postgres(env.DATABASE_URL);
  return drizzle(queryClient, { schema });
}

export type DatabaseClient = PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;
