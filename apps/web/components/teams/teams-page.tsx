"use client";

import { Button, Input } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useTeams } from "../../hooks/use-teams";

export function TeamsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, refetch } = useTeams({ search: debouncedSearch || undefined, pageSize: 50 });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-muted-foreground">Times de engenharia da Acme Engineering</p>
      </div>

      <Input
        placeholder="Buscar por nome..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-xs"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Carregando teams...
        </p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-destructive">Não foi possível carregar os teams.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum team encontrado com esses filtros.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <h2 className="font-medium">{team.name}</h2>
              {team.description && (
                <p className="mt-1 text-xs text-muted-foreground">{team.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {team.memberCount} membro{team.memberCount === 1 ? "" : "s"} · {team.serviceCount} serviço
                {team.serviceCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
