"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdrs } from "../lib/docs";

export function useAdrs(params: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["docs", "adrs", params],
    queryFn: () => listAdrs(params),
  });
}
