"use client";

import { Badge } from "@nexus/ui";
import { useAiRunDetail } from "../../hooks/use-ai-run-detail";
import { SuggestedActionCard } from "./suggested-action-card";

export function RunDetailView({ runId }: { runId: string }) {
  const { data, isLoading, isError } = useAiRunDetail(runId);

  if (isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground" role="status">
        Carregando execução...
      </p>
    );
  }

  if (isError || !data) {
    return <p className="p-4 text-sm text-destructive">Não foi possível carregar esta execução.</p>;
  }

  const confidence = data.run.confidence ?? 0;
  const assistantMessage = data.messages.find((message) => message.role === "assistant");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{data.run.model}</span>
          <Badge variant={data.run.status === "requires_approval" ? "warning" : "outline"}>{data.run.status}</Badge>
        </div>
        <Badge variant={confidence >= 0.5 ? "success" : "warning"}>Confiança: {(confidence * 100).toFixed(0)}%</Badge>
      </div>

      <p className="text-sm">{assistantMessage?.content ?? data.run.summary}</p>

      {data.evidence.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence</h3>
          <div className="mt-1 space-y-2">
            {data.evidence.map((item) => (
              <details key={item.id} className="rounded-lg border p-2 text-xs">
                <summary className="cursor-pointer font-medium">{item.toolName}</summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2">
                  {JSON.stringify({ input: item.input, output: item.output }, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}

      {(data.pendingActions.length > 0 || data.approvedActions.length > 0) && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Suggested Actions</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Ações mutáveis sempre exigem aprovação humana antes de serem executadas.
          </p>
          <div className="mt-2 space-y-2">
            {[...data.pendingActions, ...data.approvedActions].map((action) => (
              <SuggestedActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
