import { apiFetch } from "./api-client";

export interface DeploymentListItem {
  id: string;
  version: string;
  status: string;
  commitSha: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  serviceName: string;
  serviceSlug: string;
  environmentName: string;
  authorName: string | null;
}

export interface ListDeploymentsResult {
  items: DeploymentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListDeploymentsParams {
  service?: string;
  environment?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function listDeployments(
  params: ListDeploymentsParams = {},
): Promise<ListDeploymentsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/deployments${queryString ? `?${queryString}` : ""}`);
}

export interface DeploymentStage {
  id: string;
  name: string;
  order: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface DeploymentLogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface DeploymentDetail {
  deployment: {
    id: string;
    version: string;
    status: string;
    commitSha: string | null;
    commitMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    durationMs: number | null;
    createdAt: string;
  };
  service: { id: string; name: string; slug: string };
  environment: { id: string; name: string };
  author?: { id: string; name: string; email: string } | null;
  logs: DeploymentLogEntry[];
  stages: DeploymentStage[];
}

export function getDeploymentById(id: string): Promise<DeploymentDetail> {
  return apiFetch(`/deployments/${id}`);
}

export function cancelDeployment(id: string): Promise<DeploymentDetail["deployment"]> {
  return apiFetch(`/deployments/${id}/cancel`, { method: "POST" });
}

export function retryDeployment(id: string): Promise<DeploymentDetail["deployment"]> {
  return apiFetch(`/deployments/${id}/retry`, { method: "POST" });
}

export function rollbackDeployment(id: string): Promise<DeploymentDetail["deployment"]> {
  return apiFetch(`/deployments/${id}/rollback`, { method: "POST" });
}
