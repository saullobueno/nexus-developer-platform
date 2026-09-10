import { describe, expect, it } from "vitest";
import { formatRealtimeMessage } from "./realtime-message";

describe("formatRealtimeMessage", () => {
  it("formata deployment.completed", () => {
    expect(
      formatRealtimeMessage({
        type: "deployment.completed",
        data: { serviceName: "payments-api", version: "1.4.0" },
      }),
    ).toEqual({ title: "Deployment concluído", description: "payments-api v1.4.0", variant: "default" });
  });

  it("formata deployment.updated com status failed como destructive", () => {
    expect(
      formatRealtimeMessage({
        type: "deployment.updated",
        data: { serviceName: "checkout-web", version: "2.0.0", status: "failed" },
      }),
    ).toEqual({ title: "Deployment atualizado", description: "checkout-web v2.0.0 — failed", variant: "destructive" });
  });

  it("formata incident.created como destructive", () => {
    expect(
      formatRealtimeMessage({
        type: "incident.created",
        data: { title: "Latência elevada", severity: "sev2" },
      }),
    ).toEqual({ title: "Novo incidente", description: "Latência elevada — SEV2", variant: "destructive" });
  });

  it("formata incident.resolved", () => {
    expect(formatRealtimeMessage({ type: "incident.resolved", data: { title: "Erro 5xx" } })).toEqual({
      title: "Incidente resolvido",
      description: "Erro 5xx",
      variant: "default",
    });
  });

  it("usa o type bruto como fallback para eventos desconhecidos", () => {
    expect(formatRealtimeMessage({ type: "ai.run.started", data: {} })).toEqual({
      title: "ai.run.started",
      variant: "default",
    });
  });
});
