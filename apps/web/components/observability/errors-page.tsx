"use client";

import { Button } from "@nexus/ui";
import { useState } from "react";
import { useErrors } from "../../hooks/use-errors";
import { ObservabilityNav } from "./observability-nav";

const PAGE_SIZE = 20;

export function ErrorsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useErrors({ page, pageSize: PAGE_SIZE });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground">Errors agrupados por tipo e serviço</p>
      </div>

      <ObservabilityNav />

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando errors...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar os errors.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum error registrado.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Occurrences</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Affected users</th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((error) => (
                  <tr key={error.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{error.type}</p>
                      <p className="text-xs text-muted-foreground">{error.message}</p>
                    </td>
                    <td className="px-4 py-3">{error.serviceName}</td>
                    <td className="px-4 py-3">{error.occurrences}</td>
                    <td className="px-4 py-3">{error.affectedUsers}</td>
                    <td className="px-4 py-3">{new Date(error.lastSeenAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} error{data.total === 1 ? "" : "s"} · página {data.page} de{" "}
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
