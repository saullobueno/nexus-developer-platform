"use client";

import { Button, Input } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useOrganization } from "../../hooks/use-organization";
import { updateOrganization } from "../../lib/settings";

export function OrganizationTab() {
  const { data, isLoading, isError, refetch } = useOrganization();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name);
      setTimezone(data.timezone);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateOrganization({ name, timezone }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "organization"] });
    },
  });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando organização...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar a organização.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground" htmlFor="org-name">
          Name
        </label>
        <Input id="org-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground" htmlFor="org-timezone">
          Timezone
        </label>
        <Input id="org-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
      </div>
      <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
      {mutation.isError && <p className="text-sm text-destructive">Não foi possível salvar.</p>}
    </div>
  );
}
