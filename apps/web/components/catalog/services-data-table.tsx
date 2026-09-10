import { HealthIndicator, type HealthStatus } from "@nexus/ui";
import Link from "next/link";
import type { ServiceListItem } from "../../lib/services";

export function ServicesDataTable({ data }: { data: ServiceListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Owner</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Type</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Lifecycle</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Health</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Version</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Last Deploy</th>
        </tr>
      </thead>
      <tbody>
        {data.map((service) => (
          <tr key={service.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link
                href={`/catalog/services/${service.slug}`}
                className="font-medium hover:underline"
              >
                {service.name}
              </Link>
            </td>
            <td className="px-4 py-3">{service.teamName ?? "—"}</td>
            <td className="px-4 py-3">{service.type}</td>
            <td className="px-4 py-3">{service.lifecycle}</td>
            <td className="px-4 py-3">
              <HealthIndicator status={(service.health as HealthStatus) ?? "unknown"} />
            </td>
            <td className="px-4 py-3">{service.version ?? "—"}</td>
            <td className="px-4 py-3">
              {service.lastDeployedAt
                ? new Date(service.lastDeployedAt).toLocaleDateString("pt-BR")
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
