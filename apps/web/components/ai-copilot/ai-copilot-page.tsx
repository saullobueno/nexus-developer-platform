"use client";

import { Button } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { askCopilot } from "../../lib/ai-copilot";
import { RunDetailView } from "./run-detail-view";
import { RunsHistory } from "./runs-history";

const EXAMPLE_QUESTIONS = [
  "Why is payments-api slow today?",
  "Who owns identity-api?",
  "Explain checkout-web architecture",
];

export function AiCopilotPage() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => askCopilot(value),
    onSuccess: async (result) => {
      setSelectedRunId(result.run.id);
      setQuestion("");
      await queryClient.invalidateQueries({ queryKey: ["ai-copilot", "runs"] });
    },
  });

  function handleAsk() {
    if (!question.trim()) return;
    mutation.mutate(question.trim());
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <h2 className="text-sm font-semibold">Histórico</h2>
        <RunsHistory selectedId={selectedRunId} onSelect={setSelectedRunId} />
      </aside>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Copilot</h1>
          <p className="text-sm text-muted-foreground">
            Pergunte sobre serviços, deployments, incidentes, métricas e mais.
          </p>
        </div>

        <div className="space-y-2">
          <textarea
            aria-label="Pergunta"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ex.: Why is payments-api slow today?"
            rows={3}
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAsk} disabled={mutation.isPending || !question.trim()}>
              {mutation.isPending ? "Perguntando..." : "Perguntar"}
            </Button>
            {EXAMPLE_QUESTIONS.map((example) => (
              <Button key={example} variant="outline" size="sm" onClick={() => setQuestion(example)}>
                {example}
              </Button>
            ))}
          </div>
          {mutation.isError && <p className="text-sm text-destructive">Não foi possível processar a pergunta.</p>}
        </div>

        {selectedRunId && <RunDetailView runId={selectedRunId} />}
      </div>
    </div>
  );
}
