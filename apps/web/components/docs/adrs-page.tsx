"use client";

import { Badge, Button } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { useAdrs } from "../../hooks/use-adrs";
import { DocsNav } from "./docs-nav";

const STATUS_OPTIONS = ["proposed", "accepted", "deprecated", "superseded"];
const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "success" | "outline" | "warning"> = {
  accepted: "success",
  proposed: "outline",
  deprecated: "warning",
  superseded: "warning",
};

export function AdrsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdrs({
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <p className="text-sm text-muted-foreground">Architecture Decision Records</p>
      </div>

      <DocsNav />

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando ADRs...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar as ADRs.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma ADR encontrada com esses filtros.</p>
        ) : (
          <>
            <ul className="divide-y">
              {data.items.map((adr) => (
                <li key={adr.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link href={`/docs/adrs/${adr.id}`} className="font-medium hover:underline">
                    {adr.title}
                  </Link>
                  <Badge variant={STATUS_VARIANT[adr.status] ?? "outline"}>{adr.status}</Badge>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} ADR{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
