import { z } from "zod";

export const addIncidentEventSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export type AddIncidentEventDto = z.infer<typeof addIncidentEventSchema>;
