"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdrById } from "../lib/docs";

export function useAdrDetail(id: string) {
  return useQuery({
    queryKey: ["docs", "adrs", "detail", id],
    queryFn: () => getAdrById(id),
    enabled: !!id,
  });
}
