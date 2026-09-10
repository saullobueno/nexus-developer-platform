import { apiFetch } from "./api-client";

export interface TeamListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  serviceCount: number;
}

export interface ListTeamsResult {
  items: TeamListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listTeams(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<ListTeamsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/teams${queryString ? `?${queryString}` : ""}`);
}

export interface TeamDetail {
  team: { id: string; name: string; slug: string; description: string | null };
  members: Array<{ id: string; name: string; email: string }>;
  services: Array<{ id: string; name: string; slug: string; lifecycle: string }>;
  apis: Array<{ id: string; name: string; slug: string; protocol: string }>;
  documents: Array<{ id: string; title: string; slug: string; category: string }>;
  incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    detectedAt: string;
    resolvedAt: string | null;
  }>;
  deployments: Array<{ id: string; version: string; status: string; createdAt: string; serviceId: string }>;
  kpis: {
    servicesCount: number;
    deploymentsCount30d: number;
    incidentsCount30d: number;
    uptimeAvg: number | null;
    mttrHours: number | null;
    deploymentFrequencyPerWeek: number;
  };
}

export function getTeamBySlug(slug: string): Promise<TeamDetail> {
  return apiFetch(`/teams/${slug}`);
}
