"use client";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { AdrsPage } from "../../../components/docs/adrs-page";

export default function Adrs() {
  return (
    <AuthGuard>
      <AppShell>
        <AdrsPage />
      </AppShell>
    </AuthGuard>
  );
}
