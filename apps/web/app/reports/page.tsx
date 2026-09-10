"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { ReportsPage } from "../../components/reports/reports-page";

export default function Reports() {
  return (
    <AuthGuard>
      <AppShell>
        <ReportsPage />
      </AppShell>
    </AuthGuard>
  );
}
