import { Badge, type BadgeProps } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

const SEVERITY_VARIANT: Record<string, BadgeProps["variant"]> = {
  sev1: "destructive",
  sev2: "warning",
  sev3: "secondary",
  sev4: "outline",
};

export function IncidentsTab({ detail }: { detail: ServiceDetail }) {
  if (detail.incidents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum incidente registrado para este serviço.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.incidents.map((incident) => (
        <li key={incident.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{incident.title}</p>
            <p className="text-xs text-muted-foreground">
              {incident.status} · {new Date(incident.detectedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <Badge variant={SEVERITY_VARIANT[incident.severity] ?? "outline"}>
            {incident.severity.toUpperCase()}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
