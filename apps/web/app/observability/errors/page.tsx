"use client";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { ErrorsPage } from "../../../components/observability/errors-page";

export default function ObservabilityErrors() {
  return (
    <AuthGuard>
      <AppShell>
        <ErrorsPage />
      </AppShell>
    </AuthGuard>
  );
}
