"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncidentById } from "../lib/incidents";

export function useIncidentDetail(id: string) {
  return useQuery({
    queryKey: ["incidents", "detail", id],
    queryFn: () => getIncidentById(id),
    enabled: !!id,
  });
}
