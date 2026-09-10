"use client";

import { useQuery } from "@tanstack/react-query";
import { listServices, type ListServicesParams } from "../lib/services";

export function useServices(params: ListServicesParams) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => listServices(params),
  });
}
