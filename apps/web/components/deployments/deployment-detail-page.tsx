"use client";

import { Button, DeploymentStatusBadge, LogViewer, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import { useDeploymentDetail } from "../../hooks/use-deployment-detail";
import { DeploymentActions } from "./deployment-actions";
import { DeploymentTimeline } from "./deployment-timeline";

export function DeploymentDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useDeploymentDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando deployment...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este deployment.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { deployment, service, environment, author, logs, stages } = data;

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/deployments" className="hover:underline">
            Deployments
          </Link>{" "}
          / {service.name} v{deployment.version}
        </nav>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {service.name} <span className="text-muted-foreground">v{deployment.version}</span>
          </h1>
          <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {environment.name}
          {author ? ` · ${author.name}` : ""} ·{" "}
          {new Date(deployment.createdAt).toLocaleString("pt-BR")}
        </p>
        {deployment.commitMessage && (
          <p className="mt-1 text-sm text-muted-foreground">
            {deployment.commitSha?.slice(0, 7)} — {deployment.commitMessage}
          </p>
        )}
      </div>

      <DeploymentActions
        deploymentId={deployment.id}
        status={deployment.status}
        serviceName={service.name}
        version={deployment.version}
      />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Pipeline</h2>
        <DeploymentTimeline stages={stages} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Logs</h2>
        <LogViewer logs={logs} />
      </div>
    </div>
  );
}
