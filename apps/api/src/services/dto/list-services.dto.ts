import { z } from "zod";

export const listServicesSchema = z.object({
  search: z.string().trim().min(1).optional(),
  team: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  lifecycle: z.string().trim().min(1).optional(),
  health: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListServicesQuery = z.infer<typeof listServicesSchema>;
