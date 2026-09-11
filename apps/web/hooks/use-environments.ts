"use client";

import { useQuery } from "@tanstack/react-query";
import { listEnvironments } from "../lib/settings";

export function useEnvironments() {
  return useQuery({
    queryKey: ["settings", "environments"],
    queryFn: () => listEnvironments(),
  });
}
