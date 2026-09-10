"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { FeatureFlagDetailPage } from "../../../components/feature-flags/feature-flag-detail-page";

export default function FeatureFlagDetail({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <FeatureFlagDetailPage flagKey={key} />
      </AppShell>
    </AuthGuard>
  );
}
