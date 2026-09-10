"use client";

import { Button, MetricChart } from "@nexus/ui";
import { useState } from "react";
import { useMetrics } from "../../hooks/use-metrics";
import type { MetricRange } from "../../lib/observability";
import { ObservabilityNav } from "./observability-nav";

const RANGE_OPTIONS: MetricRange[] = ["15m", "1h", "6h", "24h", "7d", "30d"];

export function MetricsPage() {
  const [range, setRange] = useState<MetricRange>("24h");
  const { data, isLoading, isError, refetch } = useMetrics({ range });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground">Métricas de todos os services</p>
      </div>

      <ObservabilityNav />

      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === range ? "default" : "outline"}
            onClick={() => setRange(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Carregando métricas...
        </p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-destructive">Não foi possível carregar as métricas.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !data || data.series.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma métrica coletada neste período.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.series.map((series) => (
            <MetricChart
              key={series.name}
              title={series.name.replace(/_/g, " ")}
              unit={series.unit ?? undefined}
              data={series.points}
            />
          ))}
        </div>
      )}
    </div>
  );
}
