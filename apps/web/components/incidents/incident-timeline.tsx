"use client";

import { Button, Input } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addIncidentEvent, type IncidentEvent } from "../../lib/incidents";

export function IncidentTimeline({
  incidentId,
  events,
}: {
  incidentId: string;
  events: IncidentEvent[];
}) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addIncidentEvent(incidentId, message),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["incidents", "detail", incidentId] });
    },
  });

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
      ) : (
        <ol className="relative space-y-4 border-l pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">{event.message}</p>
              <p className="text-xs text-muted-foreground">
                {event.type}
                {event.authorName ? ` · ${event.authorName}` : ""} ·{" "}
                {new Date(event.createdAt).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
        </ol>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim()) mutation.mutate();
        }}
      >
        <Input
          placeholder="Adicionar uma atualização/comunicação..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button type="submit" disabled={mutation.isPending || !message.trim()}>
          {mutation.isPending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
      {mutation.isError && (
        <p className="text-sm text-destructive">Não foi possível registrar a atualização.</p>
      )}
    </div>
  );
}
