"use client";

import { useQuery } from "@tanstack/react-query";
import { listRoles } from "../lib/settings";

export function useRoles() {
  return useQuery({
    queryKey: ["settings", "roles"],
    queryFn: () => listRoles(),
  });
}
