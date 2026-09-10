import { DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import type { PipelineListItem } from "../../lib/pipelines";

export function PipelinesDataTable({ data }: { data: PipelineListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Pipeline</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Latest run</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">When</th>
        </tr>
      </thead>
      <tbody>
        {data.map((pipeline) => (
          <tr key={pipeline.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link href={`/pipelines/${pipeline.id}`} className="font-medium hover:underline">
                {pipeline.name}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/catalog/services/${pipeline.serviceSlug}`} className="hover:underline">
                {pipeline.serviceName}
              </Link>
            </td>
            <td className="px-4 py-3">
              {pipeline.latestRun ? (
                <DeploymentStatusBadge status={pipeline.latestRun.status as DeploymentStatus} />
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3">
              {pipeline.latestRun?.startedAt
                ? new Date(pipeline.latestRun.startedAt).toLocaleString("pt-BR")
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
