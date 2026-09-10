import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseEnv } from "./env";
import * as schema from "./schema";

export function createDatabaseClient(source?: Record<string, string | undefined>) {
  const env = parseEnv(source);
  const queryClient = postgres(env.DATABASE_URL);
  return drizzle(queryClient, { schema });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
