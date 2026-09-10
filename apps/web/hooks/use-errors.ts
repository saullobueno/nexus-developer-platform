"use client";

import { useQuery } from "@tanstack/react-query";
import { listErrors } from "../lib/observability";

export function useErrors(params: { service?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["observability", "errors", params],
    queryFn: () => listErrors(params),
  });
}
