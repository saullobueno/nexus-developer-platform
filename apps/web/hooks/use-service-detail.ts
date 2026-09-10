"use client";

import { useQuery } from "@tanstack/react-query";
import { getServiceBySlug } from "../lib/services";

export function useServiceDetail(slug: string) {
  return useQuery({
    queryKey: ["services", "detail", slug],
    queryFn: () => getServiceBySlug(slug),
    enabled: !!slug,
  });
}
