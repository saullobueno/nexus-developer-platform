import { Badge, type BadgeProps } from "@nexus/ui";
import type { DashboardSummary } from "../../lib/dashboard";

interface ActiveIncidentsSectionProps {
  incidents: DashboardSummary["activeIncidents"];
}

const SEVERITY_VARIANT: Record<string, BadgeProps["variant"]> = {
  sev1: "destructive",
  sev2: "warning",
  sev3: "secondary",
  sev4: "outline",
};

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
            <li key={incident.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{incident.title}</p>
                <p className="text-xs text-muted-foreground">{incident.status}</p>
              </div>
              <Badge variant={SEVERITY_VARIANT[incident.severity] ?? "outline"}>
                {incident.severity.toUpperCase()}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
