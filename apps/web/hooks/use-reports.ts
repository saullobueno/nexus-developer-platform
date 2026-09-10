"use client";

import { useQuery } from "@tanstack/react-query";
import { getReports } from "../lib/reports";

export function useReports(days: number) {
  return useQuery({
    queryKey: ["reports", days],
    queryFn: () => getReports(days),
  });
}
