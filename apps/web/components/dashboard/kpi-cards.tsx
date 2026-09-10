import type { DashboardSummary } from "../../lib/dashboard";

interface KpiCardsProps {
  kpis: DashboardSummary["kpis"];
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    { label: "Services", value: kpis.servicesCount },
    { label: "Deployments hoje", value: kpis.deploymentsToday },
    { label: "Incidentes ativos", value: kpis.activeIncidents },
    { label: "Deployments falhos (7d)", value: kpis.failedDeployments },
    { label: "Uptime (produção)", value: `${kpis.uptimePercentage}%` },
    { label: "SLO compliance", value: `${kpis.sloCompliance}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
