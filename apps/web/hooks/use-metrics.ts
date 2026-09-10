"use client";

import { useQuery } from "@tanstack/react-query";
import { getMetrics, type MetricRange } from "../lib/observability";

export function useMetrics(params: { service?: string; range: MetricRange }) {
  return useQuery({
    queryKey: ["observability", "metrics", params],
    queryFn: () => getMetrics(params),
  });
}
