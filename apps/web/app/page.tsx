"use client";

import { AppShell } from "../components/app-shell/app-shell";
import { AuthGuard } from "../components/auth-guard";
import { DashboardPage } from "../components/dashboard/dashboard-page";

export default function HomePage() {
  return (
    <AuthGuard>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </AuthGuard>
  );
}
