"use client";

import { use } from "react";
import { AppShell } from "../../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../../components/auth-guard";
import { PipelineRunDetailPage } from "../../../../components/pipelines/pipeline-run-detail-page";

export default function PipelineRunDetail({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <PipelineRunDetailPage runId={runId} />
      </AppShell>
    </AuthGuard>
  );
}
