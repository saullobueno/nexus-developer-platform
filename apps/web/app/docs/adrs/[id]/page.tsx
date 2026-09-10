"use client";

import { use } from "react";
import { AppShell } from "../../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../../components/auth-guard";
import { AdrDetailPage } from "../../../../components/docs/adr-detail-page";

export default function AdrDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <AdrDetailPage id={id} />
      </AppShell>
    </AuthGuard>
  );
}
