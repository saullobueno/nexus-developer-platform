import type {
  ExternalDeployment,
  ExternalError,
  ExternalMetric,
  ExternalRepository,
  IntegrationProvider,
} from "./types";

export interface GrafanaAdapterConfig {
  baseUrl: string;
  apiKey: string;
  datasourceUid: string;
}

interface PrometheusQueryResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{ metric: Record<string, string>; value: [number, string] }>;
  };
}

const QUERIES: Array<{ name: string; unit: string; promql: (repositoryId: string) => string }> = [
  { name: "request_rate", unit: "req/s", promql: (id) => `sum(rate(http_requests_total{service="${id}"}[5m]))` },
  {
    name: "p95_latency",
    unit: "ms",
    promql: (id) => `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="${id}"}[5m])) by (le)) * 1000`,
  },
  { name: "error_rate", unit: "%", promql: (id) => `sum(rate(http_requests_total{service="${id}",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="${id}"}[5m])) * 100` },
];

/**
 * Adapter real para a API HTTP do Grafana, consultando um datasource
 * Prometheus via o proxy `/api/datasources/proxy/uid/:uid/api/v1/query`. Não
 * é chamado em DEMO_MODE — ver `resolveAdapter` em `adapter-factory.ts`.
 */
export class GrafanaAdapter implements IntegrationProvider {
  constructor(private readonly config: GrafanaAdapterConfig) {}

  private async query(promql: string): Promise<PrometheusQueryResponse> {
    const url = new URL(
      `/api/datasources/proxy/uid/${this.config.datasourceUid}/api/v1/query`,
      this.config.baseUrl,
    );
    url.searchParams.set("query", promql);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Grafana API respondeu ${response.status} para a query "${promql}"`);
    }
    return response.json() as Promise<PrometheusQueryResponse>;
  }

  async getRepositories(): Promise<ExternalRepository[]> {
    // Grafana é puramente observability — não tem conceito de repositório.
    return [];
  }

  async getDeployments(): Promise<ExternalDeployment[]> {
    // Grafana não rastreia deployments (isso é GitHubAdapter/pipeline interno).
    return [];
  }

  async getErrors(): Promise<ExternalError[]> {
    // Erros agrupados por tipo são responsabilidade de SentryAdapter.
    return [];
  }

  async getMetrics(repositoryId: string): Promise<ExternalMetric[]> {
    const results = await Promise.all(
      QUERIES.map(async (definition) => {
        const response = await this.query(definition.promql(repositoryId));
        const sample = response.data.result[0];
        if (!sample) return null;
        const [timestamp, rawValue] = sample.value;
        return {
          name: definition.name,
          value: Number(rawValue),
          unit: definition.unit,
          timestamp: new Date(timestamp * 1000).toISOString(),
        };
      }),
    );
    return results.filter((metric): metric is ExternalMetric => metric !== null);
  }
}
