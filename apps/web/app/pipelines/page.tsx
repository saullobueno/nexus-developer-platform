"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { PipelinesPage } from "../../components/pipelines/pipelines-page";

export default function Pipelines() {
  return (
    <AuthGuard>
      <AppShell>
        <PipelinesPage />
      </AppShell>
    </AuthGuard>
  );
}
