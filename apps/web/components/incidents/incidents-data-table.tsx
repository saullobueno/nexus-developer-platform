import { IncidentSeverityBadge, type IncidentSeverity } from "@nexus/ui";
import Link from "next/link";
import type { IncidentListItem } from "../../lib/incidents";

export function IncidentsDataTable({ data }: { data: IncidentListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Title</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Severity</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Owner</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Detected</th>
        </tr>
      </thead>
      <tbody>
        {data.map((incident) => (
          <tr key={incident.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link href={`/incidents/${incident.id}`} className="font-medium hover:underline">
                {incident.title}
              </Link>
            </td>
            <td className="px-4 py-3">
              <IncidentSeverityBadge severity={incident.severity as IncidentSeverity} />
            </td>
            <td className="px-4 py-3">{incident.status}</td>
            <td className="px-4 py-3">{incident.ownerName ?? "—"}</td>
            <td className="px-4 py-3">{new Date(incident.detectedAt).toLocaleString("pt-BR")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
