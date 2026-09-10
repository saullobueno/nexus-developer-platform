"use client";

import { use } from "react";
import { AppShell } from "../../../../components/app-shell/app-shell";
import { AuthGuard } from "../../../../components/auth-guard";
import { ServiceDetailPage } from "../../../../components/catalog/service-detail-page";

export default function ServiceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <ServiceDetailPage slug={slug} />
      </AppShell>
    </AuthGuard>
  );
}
