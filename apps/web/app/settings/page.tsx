"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { SettingsPage } from "../../components/settings/settings-page";

export default function Settings() {
  return (
    <AuthGuard>
      <AppShell>
        <SettingsPage />
      </AppShell>
    </AuthGuard>
  );
}
