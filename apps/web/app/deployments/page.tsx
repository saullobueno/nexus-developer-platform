"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { DeploymentsPage } from "../../components/deployments/deployments-page";

export default function Deployments() {
  return (
    <AuthGuard>
      <AppShell>
        <DeploymentsPage />
      </AppShell>
    </AuthGuard>
  );
}
