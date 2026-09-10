export interface ExternalRepository {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  language: string | null;
}

export interface ExternalDeployment {
  id: string;
  repositoryId: string;
  environment: string;
  version: string;
  status: "success" | "failure" | "in_progress";
  createdAt: string;
}

export interface ExternalError {
  id: string;
  type: string;
  message: string;
  occurrences: number;
  lastSeenAt: string;
}

export interface ExternalMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface IntegrationProvider {
  getRepositories(): Promise<ExternalRepository[]>;
  getDeployments(repositoryId: string): Promise<ExternalDeployment[]>;
  getErrors(repositoryId: string): Promise<ExternalError[]>;
  getMetrics(repositoryId: string): Promise<ExternalMetric[]>;
}
