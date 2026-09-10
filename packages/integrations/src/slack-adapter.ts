import type {
  ExternalDeployment,
  ExternalError,
  ExternalMetric,
  ExternalRepository,
  IntegrationProvider,
} from "./types";

export interface SlackAdapterConfig {
  token: string;
  channel: string;
  baseUrl?: string;
}

interface SlackPostMessageResponse {
  ok: boolean;
  error?: string;
}

/**
 * Adapter real para a Slack Web API (chat.postMessage). Slack não é uma fonte
 * de dados (repositórios/deployments/erros/métricas) — é um canal de saída
 * para notificações (ver spec seção 21). Os 4 métodos de IntegrationProvider
 * retornam vazio por design; `sendNotification` é a capacidade real deste
 * adapter, usada pela Phase 14 (Realtime)/Phase 16 (Settings → Notifications).
 */
export class SlackAdapter implements IntegrationProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: SlackAdapterConfig) {
    this.baseUrl = config.baseUrl ?? "https://slack.com/api";
  }

  async getRepositories(): Promise<ExternalRepository[]> {
    return [];
  }

  async getDeployments(): Promise<ExternalDeployment[]> {
    return [];
  }

  async getErrors(): Promise<ExternalError[]> {
    return [];
  }

  async getMetrics(): Promise<ExternalMetric[]> {
    return [];
  }

  async sendNotification(text: string): Promise<{ ok: boolean; error?: string }> {
    const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ channel: this.config.channel, text }),
    });
    const body = (await response.json()) as SlackPostMessageResponse;
    return { ok: body.ok, error: body.error };
  }
}
