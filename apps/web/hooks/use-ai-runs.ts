"use client";

import { useQuery } from "@tanstack/react-query";
import { listAiRuns } from "../lib/ai-copilot";

export function useAiRuns() {
  return useQuery({
    queryKey: ["ai-copilot", "runs"],
    queryFn: () => listAiRuns(),
  });
}
