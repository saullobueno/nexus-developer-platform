"use client";

import { useQuery } from "@tanstack/react-query";
import { getDeploymentById } from "../lib/deployments";

export function useDeploymentDetail(id: string) {
  return useQuery({
    queryKey: ["deployments", "detail", id],
    queryFn: () => getDeploymentById(id),
    enabled: !!id,
  });
}
