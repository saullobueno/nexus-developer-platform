"use client";

import { useQuery } from "@tanstack/react-query";
import { listPipelines, type ListPipelinesParams } from "../lib/pipelines";

export function usePipelines(params: ListPipelinesParams) {
  return useQuery({
    queryKey: ["pipelines", params],
    queryFn: () => listPipelines(params),
  });
}
