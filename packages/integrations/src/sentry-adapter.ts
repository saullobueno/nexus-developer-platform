import type {
  ExternalDeployment,
  ExternalError,
  ExternalMetric,
  ExternalRepository,
  IntegrationProvider,
} from "./types";

export interface SentryAdapterConfig {
  token: string;
  organizationSlug: string;
  baseUrl?: string;
}

interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform: string | null;
}

interface SentryRelease {
  version: string;
  dateCreated: string;
  dateReleased: string | null;
  projects: Array<{ slug: string }>;
}

interface SentryIssue {
  id: string;
  type: string;
  title: string;
  count: string;
  lastSeen: string;
}

/**
 * Adapter real para a API do Sentry (sentry.io). Requer um internal integration
 * token com acesso de leitura à organização. Não é chamado em DEMO_MODE — ver
 * `resolveAdapter` em `adapter-factory.ts`.
 */
export class SentryAdapter implements IntegrationProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: SentryAdapterConfig) {
    this.baseUrl = config.baseUrl ?? "https://sentry.io/api/0";
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.config.token}` },
    });
    if (!response.ok) {
      throw new Error(`Sentry API respondeu ${response.status} para ${path}`);
    }
    return response.json() as Promise<T>;
  }

  async getRepositories(): Promise<ExternalRepository[]> {
    // O Sentry organiza por "projects", não repositórios de código — cada
    // projeto do Sentry mapeia para um serviço/repositório monitorado.
    const projects = await this.request<SentryProject[]>(
      `/organizations/${this.config.organizationSlug}/projects/`,
    );
    return projects.map((project) => ({
      id: project.slug,
      name: project.name,
      url: `https://sentry.io/organizations/${this.config.organizationSlug}/projects/${project.slug}/`,
      defaultBranch: "main",
      language: project.platform,
    }));
  }

  async getDeployments(repositoryId: string): Promise<ExternalDeployment[]> {
    // Releases são o equivalente mais próximo de "deployment" no modelo do Sentry.
    const releases = await this.request<SentryRelease[]>(
      `/organizations/${this.config.organizationSlug}/releases/?project=${repositoryId}&per_page=10`,
    );
    return releases
      .filter((release) => release.projects.some((project) => project.slug === repositoryId))
      .map((release) => ({
        id: release.version,
        repositoryId,
        environment: "production",
        version: release.version,
        status: release.dateReleased ? "success" : "in_progress",
        createdAt: release.dateCreated,
      }));
  }

  async getErrors(repositoryId: string): Promise<ExternalError[]> {
    const issues = await this.request<SentryIssue[]>(
      `/projects/${this.config.organizationSlug}/${repositoryId}/issues/?query=is:unresolved&limit=20`,
    );
    return issues.map((issue) => ({
      id: issue.id,
      type: issue.type,
      message: issue.title,
      occurrences: Number(issue.count),
      lastSeenAt: issue.lastSeen,
    }));
  }

  async getMetrics(): Promise<ExternalMetric[]> {
    // A Metrics API do Sentry exige configuração de métricas customizadas por
    // projeto que está fora do escopo do demo — GrafanaAdapter cobre esse caso.
    return [];
  }
}
