"use client";

import { Button, DeploymentStatusBadge, PipelineTimeline, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import { usePipelineRunDetail } from "../../hooks/use-pipeline-run-detail";
import { PipelineStagesList } from "./pipeline-stages-list";

export function PipelineRunDetailPage({ runId }: { runId: string }) {
  const { data, isLoading, isError, refetch } = usePipelineRunDetail(runId);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando execução...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar esta execução.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/pipelines" className="hover:underline">
            Pipelines
          </Link>{" "}
          /{" "}
          <Link href={`/pipelines/${data.run.pipelineId}`} className="hover:underline">
            {data.run.pipelineName}
          </Link>
        </nav>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.run.serviceName}</h1>
          <DeploymentStatusBadge status={data.run.status as DeploymentStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          {data.run.deploymentVersion ? `v${data.run.deploymentVersion} · ` : ""}
          {data.run.triggeredByName ? `${data.run.triggeredByName} · ` : ""}
          {data.run.startedAt ? new Date(data.run.startedAt).toLocaleString("pt-BR") : "—"}
        </p>
      </div>

      <PipelineTimeline stages={data.stages} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Stages</h2>
        <PipelineStagesList stages={data.stages} />
      </div>
    </div>
  );
}
