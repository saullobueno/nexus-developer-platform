import { DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import type { ServiceDetail } from "../../../lib/services";

export function DeploymentsTab({ detail }: { detail: ServiceDetail }) {
  if (detail.recentDeployments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum deployment registrado ainda.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.recentDeployments.map((deployment) => (
        <li key={deployment.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <Link href={`/deployments/${deployment.id}`} className="font-medium hover:underline">
              v{deployment.version}
            </Link>
            <p className="text-xs text-muted-foreground">
              {deployment.environmentName}
              {deployment.authorName ? ` · ${deployment.authorName}` : ""} ·{" "}
              {new Date(deployment.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
        </li>
      ))}
    </ul>
  );
}
