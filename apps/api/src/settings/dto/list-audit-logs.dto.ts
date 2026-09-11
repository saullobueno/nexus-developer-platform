import { z } from "zod";

export const listAuditLogsSchema = z.object({
  resource: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>;
