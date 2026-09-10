"use client";

import { Button, Input } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { useDocuments } from "../../hooks/use-documents";
import { DocsNav } from "./docs-nav";

const CATEGORY_OPTIONS = [
  "getting_started",
  "architecture",
  "services",
  "apis",
  "runbooks",
  "engineering_standards",
];
const PAGE_SIZE = 20;

export function DocsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useDocuments({
    search: search || undefined,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <p className="text-sm text-muted-foreground">Getting Started, Architecture, Runbooks e mais</p>
      </div>

      <DocsNav />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          aria-label="Filtrar por categoria"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas as categorias</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Carregando documentos...
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="text-destructive">Não foi possível carregar os documentos.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum documento encontrado com esses filtros.</p>
        ) : (
          <>
            <ul className="divide-y">
              {data.items.map((document) => (
                <li key={document.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <Link href={`/docs/${document.slug}`} className="font-medium hover:underline">
                      {document.title}
                    </Link>
                    {document.serviceName && (
                      <p className="text-xs text-muted-foreground">{document.serviceName}</p>
                    )}
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{document.category}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>
                {data.total} documento{data.total === 1 ? "" : "s"} · página {data.page} de {totalPages}
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
