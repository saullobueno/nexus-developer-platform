"use client";

import { useQuery } from "@tanstack/react-query";
import { getAiRunById } from "../lib/ai-copilot";

export function useAiRunDetail(id: string) {
  return useQuery({
    queryKey: ["ai-copilot", "runs", "detail", id],
    queryFn: () => getAiRunById(id),
    enabled: !!id,
  });
}
