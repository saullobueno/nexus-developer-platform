"use client";

import { Button } from "@nexus/ui";
import { useDashboardSummary } from "../../hooks/use-dashboard-summary";
import { ActiveIncidentsSection } from "./active-incidents-section";
import { AiInsightsSection } from "./ai-insights-section";
import { KpiCards } from "./kpi-cards";
import { MyServicesSection } from "./my-services-section";
import { RecentDeploymentsSection } from "./recent-deployments-section";

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando dashboard...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar o dashboard.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">Visão geral da Acme Engineering</p>
      </div>

      <KpiCards kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <MyServicesSection services={data.myServices} />
        <RecentDeploymentsSection deployments={data.recentDeployments} />
        <ActiveIncidentsSection incidents={data.activeIncidents} />
        <AiInsightsSection />
      </div>
    </div>
  );
}
