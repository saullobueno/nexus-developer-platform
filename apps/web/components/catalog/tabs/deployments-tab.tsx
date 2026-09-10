import { Badge, type BadgeProps } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  successful: "success",
  running: "secondary",
  queued: "outline",
  failed: "destructive",
  cancelled: "outline",
  rolled_back: "warning",
};

export function DeploymentsTab({ detail }: { detail: ServiceDetail }) {
  if (detail.recentDeployments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum deployment registrado ainda.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.recentDeployments.map((deployment) => (
        <li key={deployment.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">v{deployment.version}</p>
            <p className="text-xs text-muted-foreground">
              {deployment.environmentName}
              {deployment.authorName ? ` · ${deployment.authorName}` : ""} ·{" "}
              {new Date(deployment.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[deployment.status] ?? "outline"}>{deployment.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
