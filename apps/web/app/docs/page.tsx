"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { DocsPage } from "../../components/docs/docs-page";

export default function Docs() {
  return (
    <AuthGuard>
      <AppShell>
        <DocsPage />
      </AppShell>
    </AuthGuard>
  );
}
