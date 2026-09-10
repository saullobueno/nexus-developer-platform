import { z } from "zod";

export const askSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

export type AskInput = z.infer<typeof askSchema>;
