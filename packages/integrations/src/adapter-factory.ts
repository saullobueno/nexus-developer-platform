import { GitHubAdapter, type GitHubAdapterConfig } from "./github-adapter";
import { GrafanaAdapter, type GrafanaAdapterConfig } from "./grafana-adapter";
import { MockAdapter } from "./mock-adapter";
import { SentryAdapter, type SentryAdapterConfig } from "./sentry-adapter";
import type { IntegrationProvider } from "./types";

export type SupportedProvider = "github" | "sentry" | "grafana" | "slack" | "prometheus" | "mock";

export interface ResolveAdapterInput {
  provider: SupportedProvider;
  config: Record<string, unknown>;
  demoMode: boolean;
}

/**
 * Escolhe o adapter real para um provider, ou MockAdapter quando DEMO_MODE
 * está ligado ou o config obrigatório ainda não foi preenchido — nunca falha
 * por falta de credenciais, sempre cai para dados de demo (ver spec seção 27).
 */
export function resolveAdapter({ provider, config, demoMode }: ResolveAdapterInput): IntegrationProvider {
  if (demoMode) return new MockAdapter();

  switch (provider) {
    case "github": {
      const githubConfig = config as Partial<GitHubAdapterConfig>;
      if (!githubConfig.token || !githubConfig.owner) return new MockAdapter();
      return new GitHubAdapter({ token: githubConfig.token, owner: githubConfig.owner });
    }
    case "sentry": {
      const sentryConfig = config as Partial<SentryAdapterConfig>;
      if (!sentryConfig.token || !sentryConfig.organizationSlug) return new MockAdapter();
      return new SentryAdapter({ token: sentryConfig.token, organizationSlug: sentryConfig.organizationSlug });
    }
    case "grafana": {
      const grafanaConfig = config as Partial<GrafanaAdapterConfig>;
      if (!grafanaConfig.baseUrl || !grafanaConfig.apiKey || !grafanaConfig.datasourceUid) {
        return new MockAdapter();
      }
      return new GrafanaAdapter({
        baseUrl: grafanaConfig.baseUrl,
        apiKey: grafanaConfig.apiKey,
        datasourceUid: grafanaConfig.datasourceUid,
      });
    }
    default:
      return new MockAdapter();
  }
}
