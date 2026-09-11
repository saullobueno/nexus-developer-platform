import { z } from "zod";

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
