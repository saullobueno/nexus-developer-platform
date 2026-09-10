import { z } from "zod";

export const listApisSchema = z.object({
  search: z.string().trim().min(1).optional(),
  protocol: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  team: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListApisQuery = z.infer<typeof listApisSchema>;
