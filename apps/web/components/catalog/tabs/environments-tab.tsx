import { HealthIndicator, type HealthStatus } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function EnvironmentsTab({ detail }: { detail: ServiceDetail }) {
  if (detail.environments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum ambiente configurado ainda.</p>;
  }

  return (
    <table className="w-full rounded-lg border text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Environment</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Health</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Version</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Replicas</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">CPU</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Memory</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Latency</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Error rate</th>
        </tr>
      </thead>
      <tbody>
        {detail.environments.map((environment) => (
          <tr key={environment.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{environment.name}</td>
            <td className="px-4 py-3">
              <HealthIndicator status={(environment.health as HealthStatus) ?? "unknown"} />
            </td>
            <td className="px-4 py-3">{environment.version ?? "—"}</td>
            <td className="px-4 py-3">{environment.replicas ?? "—"}</td>
            <td className="px-4 py-3">
              {environment.cpuUsage !== null ? `${environment.cpuUsage}%` : "—"}
            </td>
            <td className="px-4 py-3">
              {environment.memoryUsage !== null ? `${environment.memoryUsage}%` : "—"}
            </td>
            <td className="px-4 py-3">
              {environment.latencyMs !== null ? `${environment.latencyMs}ms` : "—"}
            </td>
            <td className="px-4 py-3">
              {environment.errorRate !== null ? `${environment.errorRate}%` : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
