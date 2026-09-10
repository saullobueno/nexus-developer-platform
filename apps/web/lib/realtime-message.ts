export interface RealtimeEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface RealtimeMessage {
  title: string;
  description?: string;
  variant: "default" | "destructive";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function formatRealtimeMessage(event: RealtimeEvent): RealtimeMessage {
  const serviceName = asString(event.data.serviceName);
  const version = asString(event.data.version);
  const status = asString(event.data.status);
  const title = asString(event.data.title);
  const severity = asString(event.data.severity);
  const deploymentLabel = [serviceName, version ? `v${version}` : undefined].filter(Boolean).join(" ");

  switch (event.type) {
    case "deployment.started":
      return { title: "Deployment iniciado", description: deploymentLabel, variant: "default" };
    case "deployment.updated":
      return {
        title: "Deployment atualizado",
        description: `${deploymentLabel} — ${status}`,
        variant: status === "failed" ? "destructive" : "default",
      };
    case "deployment.completed":
      return { title: "Deployment concluído", description: deploymentLabel, variant: "default" };
    case "incident.created":
      return {
        title: "Novo incidente",
        description: [title, severity?.toUpperCase()].filter(Boolean).join(" — "),
        variant: "destructive",
      };
    case "incident.updated":
      return { title: "Incidente atualizado", description: [title, status].filter(Boolean).join(" — "), variant: "default" };
    case "incident.resolved":
      return { title: "Incidente resolvido", description: title, variant: "default" };
    default:
      return { title: event.type, variant: "default" };
  }
}
