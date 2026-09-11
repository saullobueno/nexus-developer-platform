"use client";

import { useQuery } from "@tanstack/react-query";
import { listMembers } from "../lib/settings";

export function useMembers() {
  return useQuery({
    queryKey: ["settings", "members"],
    queryFn: () => listMembers(),
  });
}
