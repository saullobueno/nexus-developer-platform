"use client";

import { Badge, Button, Switch } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  testIntegration,
  upsertIntegration,
  type IntegrationSummary,
  type TestIntegrationResult,
} from "../../lib/integrations";

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  sentry: "Sentry",
  grafana: "Grafana",
  slack: "Slack",
  prometheus: "Prometheus",
};

export function IntegrationCard({ integration }: { integration: IntegrationSummary }) {
  const queryClient = useQueryClient();
  const [configText, setConfigText] = useState(() => JSON.stringify(integration.config, null, 2));
  const [enabled, setEnabled] = useState(integration.enabled);
  const [parseError, setParseError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestIntegrationResult | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: { config: Record<string, unknown>; enabled: boolean }) =>
      upsertIntegration(integration.provider, input),
    onSuccess: async (updated) => {
      setConfigText(JSON.stringify(updated.config, null, 2));
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => testIntegration(integration.provider),
    onSuccess: (result) => setTestResult(result),
  });

  function handleSave() {
    setParseError(null);
    try {
      const config = JSON.parse(configText || "{}");
      saveMutation.mutate({ config, enabled });
    } catch {
      setParseError("Config não é um JSON válido.");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{PROVIDER_LABELS[integration.provider] ?? integration.provider}</h3>
          <Badge variant={integration.configured ? "success" : "outline"}>
            {integration.configured ? "Configurado" : "Não configurado"}
          </Badge>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label={`Ativar ${PROVIDER_LABELS[integration.provider] ?? integration.provider}`}
        />
      </div>

      <textarea
        aria-label={`Config JSON de ${integration.provider}`}
        value={configText}
        onChange={(event) => setConfigText(event.target.value)}
        rows={4}
        className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
      />
      {parseError && <p className="text-xs text-destructive">{parseError}</p>}
      {saveMutation.isError && <p className="text-xs text-destructive">Não foi possível salvar.</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
          {testMutation.isPending ? "Testando..." : "Testar conexão"}
        </Button>
      </div>

      {testResult && (
        <p className={`text-xs ${testResult.ok ? "text-emerald-600" : "text-destructive"}`}>
          {testResult.ok
            ? `Conexão OK${testResult.usingMock ? " (dados de demo)" : ""} — ${testResult.repositoryCount} repositório(s).`
            : `Falha: ${testResult.error}`}
        </p>
      )}
    </div>
  );
}
