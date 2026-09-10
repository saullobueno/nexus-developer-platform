export function AiInsightsSection() {
  return (
    <section className="rounded-lg border">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">AI Insights</h2>
      </header>
      <p className="px-4 py-6 text-sm text-muted-foreground">
        O AI Copilot chega na Phase 15 — vai analisar deployments, métricas e incidentes recentes
        para sugerir hipóteses como &ldquo;identity-api latency increased 31%&rdquo;, com evidências
        e uma ação de investigação.
      </p>
    </section>
  );
}
