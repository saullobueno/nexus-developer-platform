"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { TeamsPage } from "../../components/teams/teams-page";

export default function Teams() {
  return (
    <AuthGuard>
      <AppShell>
        <TeamsPage />
      </AppShell>
    </AuthGuard>
  );
}
