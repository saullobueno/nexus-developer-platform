"use client";

import { useQuery } from "@tanstack/react-query";
import { getTraceById } from "../lib/observability";

export function useTraceDetail(id: string) {
  return useQuery({
    queryKey: ["observability", "traces", "detail", id],
    queryFn: () => getTraceById(id),
    enabled: !!id,
  });
}
