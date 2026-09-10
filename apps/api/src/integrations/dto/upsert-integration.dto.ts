import { z } from "zod";

export const upsertIntegrationSchema = z.object({
  config: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

export type UpsertIntegrationInput = z.infer<typeof upsertIntegrationSchema>;
