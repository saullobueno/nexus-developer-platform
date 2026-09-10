"use client";

import { Button } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateIncident } from "../../lib/incidents";

export function IncidentPostmortem({
  incidentId,
  postmortem,
}: {
  incidentId: string;
  postmortem: string | null;
}) {
  const [value, setValue] = useState(postmortem ?? "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateIncident(incidentId, { postmortem: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incidents", "detail", incidentId] });
    },
  });

  return (
    <div className="space-y-2">
      <textarea
        aria-label="Postmortem"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={6}
        placeholder="Descreva o que aconteceu, causa raiz, impacto e ações de follow-up..."
        className="w-full rounded-md border border-input bg-background p-3 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || value === (postmortem ?? "")}
        >
          {mutation.isPending ? "Salvando..." : "Salvar postmortem"}
        </Button>
        {mutation.isSuccess && <span className="text-xs text-muted-foreground">Salvo.</span>}
        {mutation.isError && (
          <span className="text-xs text-destructive">Não foi possível salvar.</span>
        )}
      </div>
    </div>
  );
}
