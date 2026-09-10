"use client";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { MetricsPage } from "../../../components/observability/metrics-page";

export default function ObservabilityMetrics() {
  return (
    <AuthGuard>
      <AppShell>
        <MetricsPage />
      </AppShell>
    </AuthGuard>
  );
}
