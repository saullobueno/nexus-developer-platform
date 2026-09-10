import { z } from "zod";

export const listIncidentsSchema = z.object({
  severity: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  service: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListIncidentsQuery = z.infer<typeof listIncidentsSchema>;
