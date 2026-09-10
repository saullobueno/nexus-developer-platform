"use client";

import { ActivityTimeline, Button, type ActivityTimelineItem } from "@nexus/ui";
import Link from "next/link";
import { useFeatureFlagDetail } from "../../hooks/use-feature-flag-detail";
import { formatRolloutSummary } from "../../lib/rollout-summary";
import { FlagToggle } from "./flag-toggle";
import { RulesEditor } from "./rules-editor";

export function FeatureFlagDetailPage({ flagKey }: { flagKey: string }) {
  const { data, isLoading, isError, refetch } = useFeatureFlagDetail(flagKey);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando feature flag...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar esta feature flag.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const activityItems: ActivityTimelineItem[] = data.activity.map((entry) => ({
    id: entry.id,
    title: entry.action,
    description: entry.actorName ?? undefined,
    timestamp: entry.createdAt,
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/feature-flags" className="hover:underline">
            Feature Flags
          </Link>{" "}
          / {data.flag.name}
        </nav>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.flag.name}</h1>
          <FlagToggle flagKey={data.flag.key} enabled={data.flag.enabled} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">{data.flag.key}</p>
        {data.flag.description && <p className="mt-2 text-sm">{data.flag.description}</p>}
      </div>

      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Type</p>
        <p className="mt-1 font-medium">{data.flag.type}</p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-xs text-muted-foreground">Rollout atual</p>
        <p className="mt-1 text-sm font-medium">{formatRolloutSummary(data.rules)}</p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Rules</h2>
        <RulesEditor flagKey={data.flag.key} rules={data.rules} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Activity</h2>
        <ActivityTimeline items={activityItems} />
      </div>
    </div>
  );
}
