"use client";

import { Button } from "@nexus/ui";
import { useIntegrations } from "../../hooks/use-integrations";
import { IntegrationCard } from "./integration-card";

export function SettingsPage() {
  const { data, isLoading, isError, refetch } = useIntegrations();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Integrations</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Integrations</h2>
        <p className="text-xs text-muted-foreground">
          GitHub, Sentry, Grafana, Slack e Prometheus. Sem config válido ou com DEMO_MODE ligado, o teste de
          conexão usa dados de demonstração.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando integrations...
          </p>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 text-sm">
            <p className="text-destructive">Não foi possível carregar as integrations.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((integration) => (
              <IntegrationCard key={integration.provider} integration={integration} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
