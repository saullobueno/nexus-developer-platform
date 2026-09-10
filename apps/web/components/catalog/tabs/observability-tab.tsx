import { MetricCard } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function ObservabilityTab({ detail }: { detail: ServiceDetail }) {
  if (detail.metrics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma métrica coletada ainda. O explorador completo (gráficos, zoom, comparação de
        períodos) chega na Phase 8 — Observability.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {detail.metrics.map((metric) => (
          <MetricCard
            key={metric.name}
            label={metric.name.replace(/_/g, " ")}
            value={metric.value}
            unit={metric.unit ?? undefined}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Última leitura de cada métrica. Gráficos com série histórica, zoom e comparação de
        períodos chegam na Phase 8.
      </p>
    </div>
  );
}
