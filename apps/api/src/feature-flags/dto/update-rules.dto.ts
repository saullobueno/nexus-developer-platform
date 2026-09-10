import { z } from "zod";

export const updateRulesSchema = z.object({
  rules: z.array(
    z.object({
      kind: z.string().trim().min(1),
      value: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type UpdateRulesInput = z.infer<typeof updateRulesSchema>;
