"use client";

import { useQuery } from "@tanstack/react-query";
import { listLogs, type ListLogsParams } from "../lib/observability";

export function useObservabilityLogs(params: ListLogsParams) {
  return useQuery({
    queryKey: ["observability", "logs", params],
    queryFn: () => listLogs(params),
  });
}
