"use client";

import { useQuery } from "@tanstack/react-query";
import { listTeams } from "../lib/teams";

export function useTeams(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["teams", params],
    queryFn: () => listTeams(params),
  });
}
