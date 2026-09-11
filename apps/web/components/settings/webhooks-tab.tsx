"use client";

import { Badge, Button, Input } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useWebhooks } from "../../hooks/use-webhooks";
import { createWebhook, deleteWebhook, type WebhookWithSecret } from "../../lib/settings";

export function WebhooksTab() {
  const { data, isLoading, isError, refetch } = useWebhooks();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("");
  const [createdSecret, setCreatedSecret] = useState<WebhookWithSecret | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createWebhook({
        url,
        events: events
          .split(",")
          .map((event) => event.trim())
          .filter(Boolean),
      }),
    onSuccess: async (webhook) => {
      setCreatedSecret(webhook);
      setUrl("");
      setEvents("");
      await queryClient.invalidateQueries({ queryKey: ["settings", "webhooks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "webhooks"] });
    },
  });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando webhooks...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar os webhooks.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {createdSecret && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm dark:bg-amber-950">
          <p className="font-medium">Webhook criado. Copie o segredo agora — ele não será exibido novamente.</p>
          <code className="mt-2 block break-all rounded bg-background p-2">{createdSecret.secret}</code>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setCreatedSecret(null)}>
            Ok, guardei
          </Button>
        </div>
      )}

      <div className="max-w-md space-y-3 rounded-lg border p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="webhook-url">
            URL
          </label>
          <Input
            id="webhook-url"
            placeholder="https://exemplo.com/hooks/nexus"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="webhook-events">
            Events (separados por vírgula)
          </label>
          <Input
            id="webhook-events"
            placeholder="deployment.completed, incident.created"
            value={events}
            onChange={(event) => setEvents(event.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !url || !events}
        >
          {createMutation.isPending ? "Criando..." : "Criar webhook"}
        </Button>
        {createMutation.isError && <p className="text-sm text-destructive">Não foi possível criar o webhook.</p>}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum webhook cadastrado.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.map((webhook) => (
            <li key={webhook.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{webhook.url}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(webhook.id)}
                disabled={deleteMutation.isPending}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
