"use client";

import { useQuery } from "@tanstack/react-query";
import { listApis, type ListApisParams } from "../lib/apis";

export function useApis(params: ListApisParams) {
  return useQuery({
    queryKey: ["apis", params],
    queryFn: () => listApis(params),
  });
}
