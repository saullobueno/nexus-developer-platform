"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "../lib/settings";

export function useOrganization() {
  return useQuery({
    queryKey: ["settings", "organization"],
    queryFn: () => getOrganization(),
  });
}
