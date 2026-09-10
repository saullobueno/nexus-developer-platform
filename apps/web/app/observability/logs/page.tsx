"use client";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { LogsPage } from "../../../components/observability/logs-page";

export default function ObservabilityLogs() {
  return (
    <AuthGuard>
      <AppShell>
        <LogsPage />
      </AppShell>
    </AuthGuard>
  );
}
