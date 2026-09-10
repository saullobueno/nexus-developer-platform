import { IncidentSeverityBadge, type IncidentSeverity } from "@nexus/ui";
import type { DashboardSummary } from "../../lib/dashboard";

interface ActiveIncidentsSectionProps {
  incidents: DashboardSummary["activeIncidents"];
}

export function ActiveIncidentsSection({ incidents }: ActiveIncidentsSectionProps) {
  return (
    <section className="rounded-lg border">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Active Incidents</h2>
      </header>
      {incidents.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Nenhum incidente ativo — tudo tranquilo.
        </p>
      ) : (
        <ul className="divide-y">
          {incidents.map((incident) => (
            <li
              key={incident.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{incident.title}</p>
                <p className="text-xs text-muted-foreground">{incident.status}</p>
              </div>
              <IncidentSeverityBadge severity={incident.severity as IncidentSeverity} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
