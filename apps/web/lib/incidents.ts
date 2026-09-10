import { apiFetch } from "./api-client";

export interface IncidentListItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  detectedAt: string;
  resolvedAt: string | null;
  ownerName: string | null;
}

export interface ListIncidentsResult {
  items: IncidentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListIncidentsParams {
  severity?: string;
  status?: string;
  service?: string;
  page?: number;
  pageSize?: number;
}

export function listIncidents(params: ListIncidentsParams = {}): Promise<ListIncidentsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/incidents${queryString ? `?${queryString}` : ""}`);
}

export interface IncidentEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  authorName: string | null;
}

export interface IncidentAffectedService {
  serviceId: string;
  name: string;
  slug: string;
  impact: string | null;
}

export interface IncidentRelatedDeployment {
  id: string;
  version: string;
  status: string;
  createdAt: string;
  serviceId: string;
}

export interface IncidentLogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  serviceId: string;
}

export interface IncidentMetric {
  name: string;
  value: number;
  unit: string | null;
  timestamp: string;
  serviceId: string;
}

export interface IncidentDetail {
  incident: {
    id: string;
    title: string;
    summary: string | null;
    severity: string;
    status: string;
    postmortem: string | null;
    detectedAt: string;
    resolvedAt: string | null;
  };
  owner?: { id: string; name: string; email: string } | null;
  services: IncidentAffectedService[];
  events: IncidentEvent[];
  relatedDeployments: IncidentRelatedDeployment[];
  logs: IncidentLogEntry[];
  metrics: IncidentMetric[];
}

export function getIncidentById(id: string): Promise<IncidentDetail> {
  return apiFetch(`/incidents/${id}`);
}

export interface CreateIncidentInput {
  title: string;
  summary?: string;
  severity: string;
  serviceIds: string[];
}

export function createIncident(input: CreateIncidentInput): Promise<IncidentDetail["incident"]> {
  return apiFetch("/incidents", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateIncidentInput {
  status?: string;
  severity?: string;
  ownerId?: string;
  postmortem?: string;
}

export function updateIncident(
  id: string,
  input: UpdateIncidentInput,
): Promise<IncidentDetail["incident"]> {
  return apiFetch(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function addIncidentEvent(id: string, message: string): Promise<IncidentEvent> {
  return apiFetch(`/incidents/${id}/events`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
