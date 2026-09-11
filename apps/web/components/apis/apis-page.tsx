"use client";

import { Button, Input } from "@nexus/ui";
import { useState } from "react";
import { useApis } from "../../hooks/use-apis";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { ApisDataTable } from "./apis-data-table";

const PROTOCOL_OPTIONS = ["rest", "graphql", "grpc", "websocket"];
const STATUS_OPTIONS = ["active", "deprecated", "retired"];
const PAGE_SIZE = 20;

export function ApisPage() {
  const [search, setSearch] = useState("");
  const [protocol, setProtocol] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useApis({
    search: debouncedSearch || undefined,
    protocol: protocol || undefined,
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">APIs</h1>
        <p className="text-sm text-muted-foreground">Catálogo de APIs da Acme Engineering</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          aria-label="Filtrar por protocol"
          value={protocol}
          onChange={(event) => {
            setProtocol(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os protocolos</option>
          {PROTOCOL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
            Carregando APIs...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar o catálogo de APIs.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma API encontrada com esses filtros.</p>
        ) : (
          <>
            <ApisDataTable data={data.items} />
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} API{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
