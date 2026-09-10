"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { CatalogPage } from "../../components/catalog/catalog-page";

export default function Catalog() {
  return (
    <AuthGuard>
      <AppShell>
        <CatalogPage />
      </AppShell>
    </AuthGuard>
  );
}
