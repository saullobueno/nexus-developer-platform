"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { IncidentDetailPage } from "../../../components/incidents/incident-detail-page";

export default function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <IncidentDetailPage id={id} />
      </AppShell>
    </AuthGuard>
  );
}
