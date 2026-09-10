"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { IncidentsPage } from "../../components/incidents/incidents-page";

export default function Incidents() {
  return (
    <AuthGuard>
      <AppShell>
        <IncidentsPage />
      </AppShell>
    </AuthGuard>
  );
}
