"use client";

import { useQuery } from "@tanstack/react-query";
import { getPipelineRunById } from "../lib/pipelines";

export function usePipelineRunDetail(runId: string) {
  return useQuery({
    queryKey: ["pipelines", "runs", "detail", runId],
    queryFn: () => getPipelineRunById(runId),
    enabled: !!runId,
  });
}
