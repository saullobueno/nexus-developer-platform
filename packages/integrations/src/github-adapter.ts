import type {
  ExternalDeployment,
  ExternalError,
  ExternalMetric,
  ExternalRepository,
  IntegrationProvider,
} from "./types";

export interface GitHubAdapterConfig {
  token: string;
  owner: string;
  baseUrl?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  default_branch: string;
  language: string | null;
}

interface GitHubDeployment {
  id: number;
  environment: string;
  created_at: string;
  ref: string;
  statuses_url: string;
}

interface GitHubDeploymentStatus {
  state: string;
}

interface GitHubIssue {
  id: number;
  title: string;
  comments: number;
  updated_at: string;
}

const STATUS_MAP: Record<string, ExternalDeployment["status"]> = {
  success: "success",
  failure: "failure",
  error: "failure",
  pending: "in_progress",
  in_progress: "in_progress",
  queued: "in_progress",
};

/**
 * Adapter real para a API REST do GitHub (api.github.com). Requer um personal
 * access token (`repo`/`read:org` scope) e o `owner` (usuário ou organização).
 * Não é chamado em DEMO_MODE — ver `resolveAdapter` em `adapter-factory.ts`.
 */
export class GitHubAdapter implements IntegrationProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: GitHubAdapterConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.github.com";
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API respondeu ${response.status} para ${path}`);
    }
    return response.json() as Promise<T>;
  }

  async getRepositories(): Promise<ExternalRepository[]> {
    const repos = await this.request<GitHubRepo[]>(`/orgs/${this.config.owner}/repos?per_page=100`);
    return repos.map((repo) => ({
      id: String(repo.id),
      name: repo.name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
    }));
  }

  async getDeployments(repositoryId: string): Promise<ExternalDeployment[]> {
    const deployments = await this.request<GitHubDeployment[]>(
      `/repos/${this.config.owner}/${repositoryId}/deployments?per_page=10`,
    );

    return Promise.all(
      deployments.map(async (deployment) => {
        const statuses = await this.request<GitHubDeploymentStatus[]>(
          `/repos/${this.config.owner}/${repositoryId}/deployments/${deployment.id}/statuses?per_page=1`,
        ).catch(() => []);
        const state = statuses[0]?.state ?? "pending";

        return {
          id: String(deployment.id),
          repositoryId,
          environment: deployment.environment,
          version: deployment.ref,
          status: STATUS_MAP[state] ?? "in_progress",
          createdAt: deployment.created_at,
        };
      }),
    );
  }

  async getErrors(repositoryId: string): Promise<ExternalError[]> {
    // O GitHub não tem um conceito nativo de "erro em produção" — usamos issues
    // abertas com a label "bug" como proxy razoável dentro da interface comum.
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${this.config.owner}/${repositoryId}/issues?labels=bug&state=open&per_page=20`,
    );
    return issues.map((issue) => ({
      id: String(issue.id),
      type: "bug",
      message: issue.title,
      occurrences: issue.comments,
      lastSeenAt: issue.updated_at,
    }));
  }

  async getMetrics(): Promise<ExternalMetric[]> {
    // GitHub não expõe métricas de runtime (latência, request rate etc.) —
    // isso é responsabilidade de GrafanaAdapter/SentryAdapter.
    return [];
  }
}
