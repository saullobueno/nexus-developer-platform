"use client";

import { Button, TraceWaterfall } from "@nexus/ui";
import Link from "next/link";
import { useTraceDetail } from "../../hooks/use-trace-detail";

export function TraceDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useTraceDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando trace...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este trace.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { trace, spans } = data;

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/observability/traces" className="hover:underline">
            Traces
          </Link>{" "}
          / {trace.traceId}
        </nav>
        <h1 className="mt-1 font-mono text-xl font-semibold tracking-tight">{trace.traceId}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {trace.durationMs ? `${Math.round(trace.durationMs)}ms` : "—"} ·{" "}
          {new Date(trace.startedAt).toLocaleString("pt-BR")}
        </p>
      </div>

      <TraceWaterfall spans={spans} />
    </div>
  );
}
