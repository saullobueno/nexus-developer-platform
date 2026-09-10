import { z } from "zod";

export const RANGE_TO_HOURS: Record<string, number> = {
  "15m": 0.25,
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export const listMetricsSchema = z.object({
  service: z.string().trim().min(1).optional(),
  range: z.enum(["15m", "1h", "6h", "24h", "7d", "30d"]).default("24h"),
});

export type ListMetricsQuery = z.infer<typeof listMetricsSchema>;
