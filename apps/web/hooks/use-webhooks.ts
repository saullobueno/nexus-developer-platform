"use client";

import { useQuery } from "@tanstack/react-query";
import { listWebhooks } from "../lib/settings";

export function useWebhooks() {
  return useQuery({
    queryKey: ["settings", "webhooks"],
    queryFn: () => listWebhooks(),
  });
}
