import { HealthIndicator, MetricCard, type HealthStatus } from "@nexus/ui";
import type { ApiDetail } from "../../../lib/apis";

export function HealthTab({ detail }: { detail: ApiDetail }) {
  if (!detail.health) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem dados de saúde — esta API não está vinculada a um serviço com métricas de produção.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Status</p>
        <HealthIndicator className="mt-1" status={(detail.health.status as HealthStatus) ?? "unknown"} />
      </div>
      <MetricCard label="Latência" value={detail.health.latencyMs ?? "—"} unit="ms" />
      <MetricCard label="Taxa de erro" value={detail.health.errorRate ?? "—"} unit="%" />
    </div>
  );
}
