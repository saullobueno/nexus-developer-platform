import { Badge, type BadgeProps } from "@nexus/ui";
import type { DashboardSummary } from "../../lib/dashboard";

interface RecentDeploymentsSectionProps {
  deployments: DashboardSummary["recentDeployments"];
}

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  successful: "success",
  running: "secondary",
  queued: "outline",
  failed: "destructive",
  cancelled: "outline",
  rolled_back: "warning",
};

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
            <li key={deployment.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">
                  {deployment.serviceName}{" "}
                  <span className="text-muted-foreground">v{deployment.version}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {deployment.environmentName}
                  {deployment.authorName ? ` · ${deployment.authorName}` : ""}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[deployment.status] ?? "outline"}>
                {deployment.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
