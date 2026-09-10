"use client";

import { Button, DeploymentStatusBadge, IncidentSeverityBadge, MetricCard, type DeploymentStatus, type IncidentSeverity } from "@nexus/ui";
import Link from "next/link";
import { DeploymentLogs } from "../deployments/deployment-logs";
import { useIncidentDetail } from "../../hooks/use-incident-detail";
import { IncidentPostmortem } from "./incident-postmortem";
import { IncidentStatusControls } from "./incident-status-controls";
import { IncidentTimeline } from "./incident-timeline";

export function IncidentDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useIncidentDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando incidente...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este incidente.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { incident, owner, services, events, relatedDeployments, logs, metrics } = data;

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/incidents" className="hover:underline">
            Incidents
          </Link>{" "}
          / {incident.title}
        </nav>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{incident.title}</h1>
          <IncidentSeverityBadge severity={incident.severity as IncidentSeverity} />
        </div>
        {incident.summary && <p className="mt-1 text-sm text-muted-foreground">{incident.summary}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          Detectado em {new Date(incident.detectedAt).toLocaleString("pt-BR")}
          {owner ? ` · Owner: ${owner.name}` : ""}
        </p>
      </div>

      <IncidentStatusControls incidentId={incident.id} status={incident.status} severity={incident.severity} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Serviços afetados</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço vinculado.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {services.map((service) => (
                <li key={service.serviceId} className="px-4 py-3 text-sm">
                  <Link href={`/catalog/services/${service.slug}`} className="font-medium hover:underline">
                    {service.name}
                  </Link>
                  {service.impact && (
                    <p className="text-xs text-muted-foreground">{service.impact}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Related Deployments</h2>
          {relatedDeployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum deployment relacionado.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {relatedDeployments.map((deployment) => (
                <li key={deployment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link href={`/deployments/${deployment.id}`} className="font-medium hover:underline">
                    v{deployment.version}
                  </Link>
                  <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Metrics</h2>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma métrica disponível.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {metrics.slice(0, 8).map((metric, index) => (
              <MetricCard
                key={`${metric.name}-${metric.serviceId}-${index}`}
                label={metric.name.replace(/_/g, " ")}
                value={metric.value}
                unit={metric.unit ?? undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Logs</h2>
        <DeploymentLogs logs={logs} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Timeline &amp; Communications</h2>
        <IncidentTimeline incidentId={incident.id} events={events} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Postmortem</h2>
        <IncidentPostmortem incidentId={incident.id} postmortem={incident.postmortem} />
      </section>
    </div>
  );
}
