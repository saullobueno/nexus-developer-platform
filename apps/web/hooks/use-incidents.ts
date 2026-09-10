"use client";

import { useQuery } from "@tanstack/react-query";
import { listIncidents, type ListIncidentsParams } from "../lib/incidents";

export function useIncidents(params: ListIncidentsParams) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => listIncidents(params),
  });
}
