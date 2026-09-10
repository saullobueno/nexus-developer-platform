"use client";

import { Badge, Button } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveAction, type AiToolCall } from "../../lib/ai-copilot";

export function SuggestedActionCard({ action }: { action: AiToolCall }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => approveAction(action.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-copilot"] });
    },
  });

  if (action.approvedAt) {
    return (
      <div className="rounded-lg border p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{action.toolName}</span>
          <Badge variant="success">Aprovada</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-medium">{action.toolName}</span>
          <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(action.input, null, 2)}
          </pre>
        </div>
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Aprovando..." : "Aprovar"}
        </Button>
      </div>
      {mutation.isError && <p className="mt-2 text-xs text-destructive">Não foi possível aprovar esta ação.</p>}
    </div>
  );
}
