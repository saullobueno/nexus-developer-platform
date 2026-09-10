"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { ApisPage } from "../../components/apis/apis-page";

export default function Apis() {
  return (
    <AuthGuard>
      <AppShell>
        <ApisPage />
      </AppShell>
    </AuthGuard>
  );
}
