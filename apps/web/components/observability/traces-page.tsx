"use client";

import { Button } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { useTraces } from "../../hooks/use-traces";
import { ObservabilityNav } from "./observability-nav";

const PAGE_SIZE = 20;

export function TracesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useTraces({ page, pageSize: PAGE_SIZE });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground">Traces de todos os services</p>
      </div>

      <ObservabilityNav />

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando traces...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar os traces.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum trace registrado ainda.</p>
        ) : (
          <>
            <ul className="divide-y">
              {data.items.map((trace) => (
                <li key={trace.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <Link
                      href={`/observability/traces/${trace.id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {trace.traceId}
                    </Link>
                    <p className="text-xs text-muted-foreground">{trace.serviceName}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{trace.durationMs ? `${Math.round(trace.durationMs)}ms` : "—"}</p>
                    <p>{new Date(trace.startedAt).toLocaleString("pt-BR")}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} trace{data.total === 1 ? "" : "s"} · página {data.page} de{" "}
                {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
