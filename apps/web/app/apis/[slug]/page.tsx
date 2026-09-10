"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { ApiDetailPage } from "../../../components/apis/api-detail-page";

export default function ApiDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <ApiDetailPage slug={slug} />
      </AppShell>
    </AuthGuard>
  );
}
