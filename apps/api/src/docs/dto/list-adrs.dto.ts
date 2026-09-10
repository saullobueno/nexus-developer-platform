import { z } from "zod";

export const listAdrsSchema = z.object({
  status: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAdrsQuery = z.infer<typeof listAdrsSchema>;
