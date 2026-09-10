import { apiFetch } from "./api-client";

export interface ReportsResult {
  days: number;
  dora: {
    deploymentFrequencyPerDay: number;
    leadTimeForChangesHours: number | null;
    changeFailureRate: number | null;
    mttrHours: number | null;
  };
  reliability: {
    uptimeAvg: number | null;
    errorBudgetRemaining: number | null;
    targetUptime: number;
  };
  delivery: {
    totalDeployments: number;
    failedDeployments: number;
    rollbackRate: number | null;
    avgPipelineDurationMs: number | null;
  };
}

export function getReports(days = 30): Promise<ReportsResult> {
  return apiFetch(`/reports?days=${days}`);
}
