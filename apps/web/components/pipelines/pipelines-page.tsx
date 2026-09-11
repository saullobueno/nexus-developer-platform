"use client";

import { Button, Input } from "@nexus/ui";
import { useState } from "react";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { usePipelines } from "../../hooks/use-pipelines";
import { PipelinesDataTable } from "./pipelines-data-table";

const PAGE_SIZE = 20;

export function PipelinesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = usePipelines({
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipelines</h1>
        <p className="text-sm text-muted-foreground">Build → Unit Tests → Integration Tests → Security → Deploy</p>
      </div>

      <Input
        placeholder="Buscar por nome..."
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando pipelines...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar os pipelines.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum pipeline encontrado com esses filtros.</p>
        ) : (
          <>
            <PipelinesDataTable data={data.items} />
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} pipeline{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
