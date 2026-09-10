import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(source);
}
