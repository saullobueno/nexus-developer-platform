"use client";

import { useQuery } from "@tanstack/react-query";
import { listFeatureFlags, type ListFeatureFlagsParams } from "../lib/feature-flags";

export function useFeatureFlags(params: ListFeatureFlagsParams) {
  return useQuery({
    queryKey: ["feature-flags", params],
    queryFn: () => listFeatureFlags(params),
  });
}
