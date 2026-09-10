import { createSeededRandom, hashString } from "./lib/seeded-random";
import type {
  ExternalDeployment,
  ExternalError,
  ExternalMetric,
  ExternalRepository,
  IntegrationProvider,
} from "./types";

const MOCK_REPOSITORIES: ExternalRepository[] = [
  {
    id: "payments-api",
    name: "payments-api",
    url: "https://github.com/acme/payments-api",
    defaultBranch: "main",
    language: "TypeScript",
  },
  {
    id: "checkout-web",
    name: "checkout-web",
    url: "https://github.com/acme/checkout-web",
    defaultBranch: "main",
    language: "TypeScript",
  },
  {
    id: "identity-api",
    name: "identity-api",
    url: "https://github.com/acme/identity-api",
    defaultBranch: "main",
    language: "Go",
  },
  {
    id: "customer-api",
    name: "customer-api",
    url: "https://github.com/acme/customer-api",
    defaultBranch: "main",
    language: "TypeScript",
  },
  {
    id: "orders-service",
    name: "orders-service",
    url: "https://github.com/acme/orders-service",
    defaultBranch: "main",
    language: "Java",
  },
  {
    id: "notifications-worker",
    name: "notifications-worker",
    url: "https://github.com/acme/notifications-worker",
    defaultBranch: "main",
    language: "TypeScript",
  },
  {
    id: "analytics-api",
    name: "analytics-api",
    url: "https://github.com/acme/analytics-api",
    defaultBranch: "main",
    language: "Python",
  },
  {
    id: "data-pipeline",
    name: "data-pipeline",
    url: "https://github.com/acme/data-pipeline",
    defaultBranch: "main",
    language: "Python",
  },
];

const DEPLOYMENT_STATUSES: ExternalDeployment["status"][] = [
  "success",
  "success",
  "success",
  "failure",
  "in_progress",
];

const METRIC_DEFINITIONS = [
  { name: "request_rate", unit: "req/s", base: 120 },
  { name: "p95_latency", unit: "ms", base: 220 },
  { name: "error_rate", unit: "%", base: 0.4 },
];

/**
 * Implementação de IntegrationProvider que não faz nenhuma chamada de rede —
 * usada em DEMO_MODE no lugar de GitHubAdapter/SentryAdapter/GrafanaAdapter/
 * SlackAdapter reais (que chegam na Phase 13). Os dados são gerados com uma
 * seed determinística por repositoryId, então o mesmo id sempre retorna os
 * mesmos valores (exceto timestamps).
 */
export class MockAdapter implements IntegrationProvider {
  async getRepositories(): Promise<ExternalRepository[]> {
    return MOCK_REPOSITORIES;
  }

  async getDeployments(repositoryId: string): Promise<ExternalDeployment[]> {
    const random = createSeededRandom(hashString(repositoryId));

    return Array.from({ length: 5 }, (_, index) => {
      const status = DEPLOYMENT_STATUSES[Math.floor(random() * DEPLOYMENT_STATUSES.length)] ?? "success";
      return {
        id: `${repositoryId}-deploy-${index}`,
        repositoryId,
        environment: index === 0 ? "production" : "staging",
        version: `1.${index}.0`,
        status,
        createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6).toISOString(),
      };
    });
  }

  async getErrors(repositoryId: string): Promise<ExternalError[]> {
    const random = createSeededRandom(hashString(repositoryId) + 1);
    const now = new Date().toISOString();

    return [
      {
        id: `${repositoryId}-error-timeout`,
        type: "TimeoutError",
        message: "Request to downstream service timed out",
        occurrences: Math.floor(random() * 50) + 1,
        lastSeenAt: now,
      },
      {
        id: `${repositoryId}-error-null-ref`,
        type: "TypeError",
        message: "Cannot read properties of undefined",
        occurrences: Math.floor(random() * 20) + 1,
        lastSeenAt: now,
      },
    ];
  }

  async getMetrics(repositoryId: string): Promise<ExternalMetric[]> {
    const random = createSeededRandom(hashString(repositoryId) + 2);
    const now = new Date().toISOString();

    return METRIC_DEFINITIONS.map((definition) => ({
      name: definition.name,
      value: Number((definition.base * (0.8 + random() * 0.4)).toFixed(2)),
      unit: definition.unit,
      timestamp: now,
    }));
  }
}
