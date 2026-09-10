import { apiFetch } from "./api-client";

export interface IntegrationSummary {
  provider: string;
  configured: boolean;
  enabled: boolean;
  config: Record<string, unknown>;
}

export function listIntegrations(): Promise<IntegrationSummary[]> {
  return apiFetch("/integrations");
}

export function upsertIntegration(
  provider: string,
  input: { config: Record<string, unknown>; enabled: boolean },
): Promise<IntegrationSummary> {
  return apiFetch(`/integrations/${provider}`, { method: "PUT", body: JSON.stringify(input) });
}

export interface TestIntegrationResult {
  ok: boolean;
  usingMock: boolean;
  repositoryCount?: number;
  error?: string;
}

export function testIntegration(provider: string): Promise<TestIntegrationResult> {
  return apiFetch(`/integrations/${provider}/test`, { method: "POST" });
}
