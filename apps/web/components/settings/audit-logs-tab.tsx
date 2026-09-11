"use client";

import { Button, Input } from "@nexus/ui";
import { useState } from "react";
import { useAuditLogs } from "../../hooks/use-audit-logs";

const PAGE_SIZE = 20;

export function AuditLogsTab() {
  const [resource, setResource] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAuditLogs({
    resource: resource || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-3">
      <Input
        placeholder="Filtrar por resource (ex.: deployment, incident, user)..."
        value={resource}
        onChange={(event) => {
          setResource(event.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Carregando audit logs...
        </p>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-destructive">Não foi possível carregar os audit logs.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Resource</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">
                    {log.resource}
                    {log.resourceId && <span className="text-xs text-muted-foreground"> #{log.resourceId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3">{log.actorName ?? "—"}</td>
                  <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-1 py-3 text-sm text-muted-foreground">
            <span>
              {data.total} registro{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
  );
}
