import { apiFetch } from "./api-client";

export interface ServiceListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  lifecycle: string;
  language: string | null;
  framework: string | null;
  teamName: string | null;
  health: string | null;
  version: string | null;
  lastDeployedAt: string | null;
}

export interface ListServicesResult {
  items: ServiceListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListServicesParams {
  search?: string;
  team?: string;
  type?: string;
  lifecycle?: string;
  health?: string;
  page?: number;
  pageSize?: number;
}

export function listServices(params: ListServicesParams = {}): Promise<ListServicesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/services${queryString ? `?${queryString}` : ""}`);
}

export interface ServiceDetail {
  service: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: string;
    lifecycle: string;
    language: string | null;
    framework: string | null;
    runtime: string | null;
    repositoryUrl: string | null;
    docsUrl: string | null;
    runbookUrl: string | null;
    dashboardUrl: string | null;
  };
  team?: { id: string; name: string; slug: string } | null;
  owners: Array<{ id: string; name: string; email: string }>;
  environments: Array<{
    id: string;
    name: string;
    slug: string;
    health: string | null;
    version: string | null;
    replicas: number | null;
    cpuUsage: number | null;
    memoryUsage: number | null;
    latencyMs: number | null;
    errorRate: number | null;
    lastDeployedAt: string | null;
  }>;
  recentDeployments: Array<{
    id: string;
    version: string;
    status: string;
    createdAt: string;
    environmentName: string;
    authorName: string | null;
  }>;
  dependencies: Array<{ id: string; name: string; slug?: string; isExternal: boolean }>;
  dependents: Array<{ id: string; name: string; slug: string }>;
  incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    detectedAt: string;
  }>;
  metrics: Array<{ name: string; value: number; unit: string | null; timestamp: string }>;
  apis: Array<{ id: string; name: string; slug: string; protocol: string; status: string }>;
  documents: Array<{ id: string; title: string; slug: string; category: string }>;
}

export function getServiceBySlug(slug: string): Promise<ServiceDetail> {
  return apiFetch(`/services/${slug}`);
}
