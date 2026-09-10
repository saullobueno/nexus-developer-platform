import { z } from "zod";

export const listErrorsSchema = z.object({
  service: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListErrorsQuery = z.infer<typeof listErrorsSchema>;
