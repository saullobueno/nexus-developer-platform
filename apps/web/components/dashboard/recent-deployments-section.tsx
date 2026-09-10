import { DeploymentStatusBadge, type DeploymentStatus } from "@nexus/ui";
import Link from "next/link";
import type { DashboardSummary } from "../../lib/dashboard";

interface RecentDeploymentsSectionProps {
  deployments: DashboardSummary["recentDeployments"];
}

export function RecentDeploymentsSection({ deployments }: RecentDeploymentsSectionProps) {
  return (
    <section className="rounded-lg border">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Recent Deployments</h2>
      </header>
      {deployments.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum deployment ainda.</p>
      ) : (
        <ul className="divide-y">
          {deployments.map((deployment) => (
            <li
              key={deployment.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <Link href={`/deployments/${deployment.id}`} className="font-medium hover:underline">
                  {deployment.serviceName}{" "}
                  <span className="text-muted-foreground">v{deployment.version}</span>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {deployment.environmentName}
                  {deployment.authorName ? ` · ${deployment.authorName}` : ""}
                </p>
              </div>
              <DeploymentStatusBadge status={deployment.status as DeploymentStatus} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
