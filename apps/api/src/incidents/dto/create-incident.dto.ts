import { z } from "zod";

export const createIncidentSchema = z.object({
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().max(2000).optional(),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]).default("sev3"),
  serviceIds: z.array(z.string().uuid()).min(1),
});

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
