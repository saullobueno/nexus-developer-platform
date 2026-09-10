"use client";

import { useQuery } from "@tanstack/react-query";
import { listDocuments, type ListDocumentsParams } from "../lib/docs";

export function useDocuments(params: ListDocumentsParams) {
  return useQuery({
    queryKey: ["docs", "documents", params],
    queryFn: () => listDocuments(params),
  });
}
