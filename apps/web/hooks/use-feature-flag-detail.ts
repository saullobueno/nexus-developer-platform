"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeatureFlagByKey } from "../lib/feature-flags";

export function useFeatureFlagDetail(key: string) {
  return useQuery({
    queryKey: ["feature-flags", "detail", key],
    queryFn: () => getFeatureFlagByKey(key),
    enabled: !!key,
  });
}
