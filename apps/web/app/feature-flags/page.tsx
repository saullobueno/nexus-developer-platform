"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { FeatureFlagsPage } from "../../components/feature-flags/feature-flags-page";

export default function FeatureFlags() {
  return (
    <AuthGuard>
      <AppShell>
        <FeatureFlagsPage />
      </AppShell>
    </AuthGuard>
  );
}
