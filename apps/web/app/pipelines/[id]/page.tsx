"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { PipelineDetailPage } from "../../../components/pipelines/pipeline-detail-page";

export default function PipelineDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <PipelineDetailPage id={id} />
      </AppShell>
    </AuthGuard>
  );
}
