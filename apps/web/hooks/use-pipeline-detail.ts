"use client";

import { useQuery } from "@tanstack/react-query";
import { getPipelineById } from "../lib/pipelines";

export function usePipelineDetail(id: string, params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["pipelines", "detail", id, params],
    queryFn: () => getPipelineById(id, params),
    enabled: !!id,
  });
}
