"use client";

import { Button, Input } from "@nexus/ui";
import { useState } from "react";
import { useObservabilityLogs } from "../../hooks/use-observability-logs";
import { parseLogQuery } from "../../lib/log-query";
import { ObservabilityNav } from "./observability-nav";

const PAGE_SIZE = 50;

const LEVEL_COLOR: Record<string, string> = {
  debug: "text-muted-foreground",
  info: "text-foreground",
  warn: "text-amber-600",
  error: "text-destructive",
  fatal: "text-destructive",
};

export function LogsPage() {
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(1);
  const filters = parseLogQuery(queryText);

  const { data, isLoading, isError, refetch } = useObservabilityLogs({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground">Logs de todos os services</p>
      </div>

      <ObservabilityNav />

      <Input
        placeholder="level:error service:payments-api trace:abc123"
        value={queryText}
        onChange={(event) => {
          setQueryText(event.target.value);
          setPage(1);
        }}
      />

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando logs...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar os logs.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhum log encontrado com esses filtros.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Level</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Trace ID</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id} className="border-b font-mono text-xs last:border-0">
                    <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString("pt-BR")}</td>
                    <td className={`px-4 py-3 uppercase ${LEVEL_COLOR[log.level] ?? ""}`}>
                      {log.level}
                    </td>
                    <td className="px-4 py-3">{log.serviceName}</td>
                    <td className="px-4 py-3">{log.message}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.traceId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} log{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
