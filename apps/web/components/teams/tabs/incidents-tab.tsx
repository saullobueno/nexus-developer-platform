import { IncidentSeverityBadge, type IncidentSeverity } from "@nexus/ui";
import Link from "next/link";
import type { TeamDetail } from "../../../lib/teams";

export function IncidentsTab({ detail }: { detail: TeamDetail }) {
  if (detail.incidents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum incidente recente para os serviços deste time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.incidents.map((incident) => (
        <li key={incident.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <Link href={`/incidents/${incident.id}`} className="font-medium hover:underline">
            {incident.title}
          </Link>
          <div className="flex items-center gap-2">
            <IncidentSeverityBadge severity={incident.severity as IncidentSeverity} />
            <span className="text-xs text-muted-foreground">{incident.status}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
