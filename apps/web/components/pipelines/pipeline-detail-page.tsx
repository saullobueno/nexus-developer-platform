"use client";

import { Button, DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import { usePipelineDetail } from "../../hooks/use-pipeline-detail";

export function PipelineDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = usePipelineDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando pipeline...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este pipeline.</p>
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
          / {data.pipeline.name}
        </nav>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.pipeline.name}</h1>
        <p className="text-sm text-muted-foreground">
          <Link href={`/catalog/services/${data.pipeline.serviceSlug}`} className="hover:underline">
            {data.pipeline.serviceName}
          </Link>
        </p>
      </div>

      <div className="rounded-lg border">
        {data.runs.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground">Run</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Deployment</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Triggered by</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.items.map((run) => (
                <tr key={run.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link href={`/pipelines/runs/${run.id}`} className="font-medium hover:underline">
                      <DeploymentStatusBadge status={run.status as DeploymentStatus} />
                    </Link>
                  </td>
                  <td className="px-4 py-3">{run.deploymentVersion ? `v${run.deploymentVersion}` : "—"}</td>
                  <td className="px-4 py-3">{run.triggeredByName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
