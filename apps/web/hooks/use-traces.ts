"use client";

import { useQuery } from "@tanstack/react-query";
import { listTraces } from "../lib/observability";

export function useTraces(params: { service?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["observability", "traces", params],
    queryFn: () => listTraces(params),
  });
}
