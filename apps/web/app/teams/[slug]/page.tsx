"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { TeamDetailPage } from "../../../components/teams/team-detail-page";

export default function TeamDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <TeamDetailPage slug={slug} />
      </AppShell>
    </AuthGuard>
  );
}
