"use client";

import { use } from "react";
import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../components/auth-guard";
import { DocumentDetailPage } from "../../../components/docs/document-detail-page";

export default function DocumentDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <DocumentDetailPage slug={slug} />
      </AppShell>
    </AuthGuard>
  );
}
