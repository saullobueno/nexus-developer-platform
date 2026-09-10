import { z } from "zod";

export const updateIncidentSchema = z.object({
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]).optional(),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]).optional(),
  ownerId: z.string().uuid().optional(),
  postmortem: z.string().trim().max(10000).optional(),
});

export type UpdateIncidentDto = z.infer<typeof updateIncidentSchema>;
