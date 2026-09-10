import { DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import type { TeamDetail } from "../../../lib/teams";

export function DeploymentsTab({ detail }: { detail: TeamDetail }) {
  if (detail.deployments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum deployment recente para os serviços deste time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.deployments.map((deployment) => (
        <li key={deployment.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <Link href={`/deployments/${deployment.id}`} className="font-medium hover:underline">
            v{deployment.version}
          </Link>
          <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
        </li>
      ))}
    </ul>
  );
}
