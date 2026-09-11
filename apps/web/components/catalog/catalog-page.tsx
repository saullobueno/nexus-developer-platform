"use client";

import { Button, Input } from "@nexus/ui";
import { useState } from "react";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useServices } from "../../hooks/use-services";
import { ServicesDataTable } from "./services-data-table";

const TYPE_OPTIONS = [
  "service",
  "website",
  "library",
  "api",
  "database",
  "worker",
  "infrastructure",
  "ml_model",
];
const LIFECYCLE_OPTIONS = ["experimental", "development", "production", "deprecated"];
const HEALTH_OPTIONS = ["healthy", "degraded", "unhealthy", "unknown"];
const PAGE_SIZE = 20;

export function CatalogPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [health, setHealth] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useServices({
    search: debouncedSearch || undefined,
    type: type || undefined,
    lifecycle: lifecycle || undefined,
    health: health || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">Services da Acme Engineering</p>
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
          aria-label="Filtrar por tipo"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os tipos</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por lifecycle"
          value={lifecycle}
          onChange={(event) => {
            setLifecycle(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os lifecycles</option>
          {LIFECYCLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por saúde"
          value={health}
          onChange={(event) => {
            setHealth(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {HEALTH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando services...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar o catálogo.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhum serviço encontrado com esses filtros.
          </p>
        ) : (
          <>
            <ServicesDataTable data={data.items} />
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} serviço{data.total === 1 ? "" : "s"} · página {data.page} de{" "}
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
