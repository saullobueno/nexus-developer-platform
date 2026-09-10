"use client";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { TracesPage } from "../../../components/observability/traces-page";

export default function ObservabilityTraces() {
  return (
    <AuthGuard>
      <AppShell>
        <TracesPage />
      </AppShell>
    </AuthGuard>
  );
}
