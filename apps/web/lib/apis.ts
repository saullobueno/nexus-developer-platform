import { apiFetch } from "./api-client";

export interface ApiListItem {
  id: string;
  name: string;
  slug: string;
  version: string;
  status: string;
  protocol: string;
  teamName: string | null;
  serviceName: string | null;
  serviceSlug: string | null;
}

export interface ListApisResult {
  items: ApiListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListApisParams {
  search?: string;
  protocol?: string;
  status?: string;
  team?: string;
  page?: number;
  pageSize?: number;
}

export function listApis(params: ListApisParams = {}): Promise<ListApisResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/apis${queryString ? `?${queryString}` : ""}`);
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  description: string | null;
  requestSchema: unknown;
  responseSchema: unknown;
}

export interface ApiConsumer {
  id: string;
  name: string;
  consumerServiceName: string | null;
  consumerServiceSlug: string | null;
}

export interface ApiActivityItem {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
}

export interface ApiDetail {
  api: {
    id: string;
    name: string;
    slug: string;
    version: string;
    status: string;
    protocol: string;
    description: string | null;
  };
  team?: { id: string; name: string; slug: string } | null;
  service?: { id: string; name: string; slug: string } | null;
  health: { status: string | null; latencyMs: number | null; errorRate: number | null } | null;
  endpoints: ApiEndpoint[];
  consumers: ApiConsumer[];
  documents: Array<{ id: string; title: string; slug: string; category: string }>;
  activity: ApiActivityItem[];
}

export function getApiBySlug(slug: string): Promise<ApiDetail> {
  return apiFetch(`/apis/${slug}`);
}
