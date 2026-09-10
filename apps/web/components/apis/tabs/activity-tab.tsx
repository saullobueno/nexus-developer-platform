import { ActivityTimeline, type ActivityTimelineItem } from "@nexus/ui";
import type { ApiDetail } from "../../../lib/apis";

export function ActivityTab({ detail }: { detail: ApiDetail }) {
  const items: ActivityTimelineItem[] = detail.activity.map((entry) => ({
    id: entry.id,
    title: entry.action,
    description: entry.actorName ?? undefined,
    timestamp: entry.createdAt,
  }));

  return <ActivityTimeline items={items} />;
}
