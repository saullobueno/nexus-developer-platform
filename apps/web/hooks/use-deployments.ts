"use client";

import { useQuery } from "@tanstack/react-query";
import { listDeployments, type ListDeploymentsParams } from "../lib/deployments";

export function useDeployments(params: ListDeploymentsParams) {
  return useQuery({
    queryKey: ["deployments", params],
    queryFn: () => listDeployments(params),
  });
}
