"use client";

import { Badge, Button } from "@nexus/ui";
import { useRoles } from "../../hooks/use-roles";

export function RolesTab() {
  const { data, isLoading, isError, refetch } = useRoles();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando roles...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar as roles.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((role) => (
        <div key={role.id} className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{role.name}</h3>
            {role.isSystem && <Badge variant="outline">system</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {role.permissions.map((permission) => (
              <Badge key={permission} variant="secondary">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
