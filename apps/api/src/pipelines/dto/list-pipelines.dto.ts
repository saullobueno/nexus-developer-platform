import { z } from "zod";

export const listPipelinesSchema = z.object({
  search: z.string().trim().min(1).optional(),
  service: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPipelinesQuery = z.infer<typeof listPipelinesSchema>;
