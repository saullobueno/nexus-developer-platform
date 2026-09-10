"use client";

import { Button, MetricCard } from "@nexus/ui";
import { useState } from "react";
import { useReports } from "../../hooks/use-reports";

const DAYS_OPTIONS = [7, 30, 90] as const;

export function ReportsPage() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, isError, refetch } = useReports(days);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">DORA, Reliability e Delivery</p>
      </div>

      <div className="flex gap-2">
        {DAYS_OPTIONS.map((option) => (
          <Button
            key={option}
            variant={days === option ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(option)}
          >
            {option}d
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Carregando reports...
        </p>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-destructive">Não foi possível carregar os reports.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">DORA</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Deployment Frequency"
                value={data.dora.deploymentFrequencyPerDay}
                unit="/dia"
              />
              <MetricCard
                label="Lead Time for Changes"
                value={data.dora.leadTimeForChangesHours ?? "—"}
                unit={data.dora.leadTimeForChangesHours !== null ? "h" : undefined}
                helpText="Aproximado pela duração do deployment (sem timestamp de commit no schema)."
              />
              <MetricCard
                label="Change Failure Rate"
                value={data.dora.changeFailureRate ?? "—"}
                unit={data.dora.changeFailureRate !== null ? "%" : undefined}
              />
              <MetricCard
                label="MTTR"
                value={data.dora.mttrHours ?? "—"}
                unit={data.dora.mttrHours !== null ? "h" : undefined}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Reliability</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Uptime"
                value={data.reliability.uptimeAvg ?? "—"}
                unit={data.reliability.uptimeAvg !== null ? "%" : undefined}
              />
              <MetricCard label="SLO target" value={data.reliability.targetUptime} unit="%" />
              <MetricCard
                label="Error budget"
                value={data.reliability.errorBudgetRemaining ?? "—"}
                unit={data.reliability.errorBudgetRemaining !== null ? "%" : undefined}
                helpText="Uptime atual menos o SLO target."
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Deployments" value={data.delivery.totalDeployments} />
              <MetricCard label="Failed deployments" value={data.delivery.failedDeployments} />
              <MetricCard
                label="Rollback rate"
                value={data.delivery.rollbackRate ?? "—"}
                unit={data.delivery.rollbackRate !== null ? "%" : undefined}
              />
              <MetricCard
                label="Pipeline duration (avg)"
                value={
                  data.delivery.avgPipelineDurationMs !== null
                    ? (data.delivery.avgPipelineDurationMs / 1000 / 60).toFixed(1)
                    : "—"
                }
                unit={data.delivery.avgPipelineDurationMs !== null ? "min" : undefined}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
