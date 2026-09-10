"use client";

import { use } from "react";
import { AppShell } from "../../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../../components/auth-guard";
import { TraceDetailPage } from "../../../../components/observability/trace-detail-page";

export default function ObservabilityTraceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <TraceDetailPage id={id} />
      </AppShell>
    </AuthGuard>
  );
}
