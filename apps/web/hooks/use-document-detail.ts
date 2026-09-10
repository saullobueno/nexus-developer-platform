"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocumentBySlug } from "../lib/docs";

export function useDocumentDetail(slug: string) {
  return useQuery({
    queryKey: ["docs", "documents", "detail", slug],
    queryFn: () => getDocumentBySlug(slug),
    enabled: !!slug,
  });
}
