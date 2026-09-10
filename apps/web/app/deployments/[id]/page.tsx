"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { DeploymentDetailPage } from "../../../components/deployments/deployment-detail-page";

export default function DeploymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <DeploymentDetailPage id={id} />
      </AppShell>
    </AuthGuard>
  );
}
