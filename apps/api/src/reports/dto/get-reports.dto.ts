import { z } from "zod";

export const getReportsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type GetReportsQuery = z.infer<typeof getReportsSchema>;
