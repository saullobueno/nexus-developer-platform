import { z } from "zod";

export const listLogsSchema = z.object({
  level: z.string().trim().min(1).optional(),
  service: z.string().trim().min(1).optional(),
  traceId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type ListLogsQuery = z.infer<typeof listLogsSchema>;
