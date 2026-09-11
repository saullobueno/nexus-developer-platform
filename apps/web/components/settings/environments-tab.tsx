"use client";

import { Badge, Button } from "@nexus/ui";
import { useEnvironments } from "../../hooks/use-environments";

export function EnvironmentsTab() {
  const { data, isLoading, isError, refetch } = useEnvironments();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando environments...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar os environments.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum environment cadastrado.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {data.map((environment) => (
        <li key={environment.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{environment.name}</p>
            {environment.url && <p className="text-xs text-muted-foreground">{environment.url}</p>}
          </div>
          <Badge variant="outline">{environment.type}</Badge>
        </li>
      ))}
    </ul>
  );
}
