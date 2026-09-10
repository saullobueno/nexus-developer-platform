import { DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import type { DeploymentListItem } from "../../lib/deployments";

export function DeploymentsDataTable({ data }: { data: DeploymentListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Version</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Environment</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Author</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Started</th>
        </tr>
      </thead>
      <tbody>
        {data.map((deployment) => (
          <tr key={deployment.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link
                href={`/deployments/${deployment.id}`}
                className="font-medium hover:underline"
              >
                {deployment.serviceName}
              </Link>
            </td>
            <td className="px-4 py-3">v{deployment.version}</td>
            <td className="px-4 py-3">{deployment.environmentName}</td>
            <td className="px-4 py-3">{deployment.authorName ?? "—"}</td>
            <td className="px-4 py-3">
              <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
            </td>
            <td className="px-4 py-3">
              {deployment.startedAt
                ? new Date(deployment.startedAt).toLocaleString("pt-BR")
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
