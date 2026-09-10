"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamBySlug } from "../lib/teams";

export function useTeamDetail(slug: string) {
  return useQuery({
    queryKey: ["teams", "detail", slug],
    queryFn: () => getTeamBySlug(slug),
    enabled: !!slug,
  });
}
