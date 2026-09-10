"use client";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGuard } from "../../components/auth-guard";
import { AiCopilotPage } from "../../components/ai-copilot/ai-copilot-page";

export default function AiCopilot() {
  return (
    <AuthGuard>
      <AppShell>
        <AiCopilotPage />
      </AppShell>
    </AuthGuard>
  );
}
