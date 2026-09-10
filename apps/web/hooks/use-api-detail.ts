"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiBySlug } from "../lib/apis";

export function useApiDetail(slug: string) {
  return useQuery({
    queryKey: ["apis", "detail", slug],
    queryFn: () => getApiBySlug(slug),
    enabled: !!slug,
  });
}
