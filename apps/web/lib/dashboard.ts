import { apiFetch } from "./api-client";

export interface DashboardSummary {
  kpis: {
    servicesCount: number;
    deploymentsToday: number;
    activeIncidents: number;
    failedDeployments: number;
    uptimePercentage: number;
    sloCompliance: number;
  };
  myServices: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    lifecycle: string;
  }>;
  recentDeployments: Array<{
    id: string;
    version: string;
    status: string;
    createdAt: string;
    serviceName: string;
    environmentName: string;
    authorName: string | null;
  }>;
  activeIncidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    detectedAt: string;
  }>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch("/dashboard/summary");
}
