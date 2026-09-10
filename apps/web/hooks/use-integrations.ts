"use client";

import { useQuery } from "@tanstack/react-query";
import { listIntegrations } from "../lib/integrations";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: () => listIntegrations(),
  });
}
