"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "../lib/settings";

export function useAuditLogs(params: { resource?: string; action?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["settings", "audit-logs", params],
    queryFn: () => listAuditLogs(params),
  });
}
