import { ActivityTimeline, type ActivityTimelineItem } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function ActivityTab({ detail }: { detail: ServiceDetail }) {
  const deploymentItems: ActivityTimelineItem[] = detail.recentDeployments.map((deployment) => ({
    id: `deployment-${deployment.id}`,
    title: `Deploy v${deployment.version} — ${deployment.status}`,
    description: deployment.environmentName,
    timestamp: deployment.createdAt,
  }));

  const incidentItems: ActivityTimelineItem[] = detail.incidents.map((incident) => ({
    id: `incident-${incident.id}`,
    title: `Incidente: ${incident.title}`,
    description: `${incident.severity.toUpperCase()} · ${incident.status}`,
    timestamp: incident.detectedAt,
  }));

  const items = [...deploymentItems, ...incidentItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return <ActivityTimeline items={items} />;
}
