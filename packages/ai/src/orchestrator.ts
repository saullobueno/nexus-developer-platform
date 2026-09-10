import { runDemoOrchestrator } from "./demo-orchestrator";
import { selectModel } from "./model-selection";
import { runRealOrchestrator } from "./real-orchestrator";
import type { CopilotResponse, ToolExecutor } from "./types";

export interface RunCopilotQueryInput {
  question: string;
  knownServiceSlugs: string[];
  readExecutors: Partial<Record<string, ToolExecutor>>;
  demoMode: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface RunCopilotQueryResult extends CopilotResponse {
  usingMock: boolean;
  model: string;
}

/**
 * Ponto de entrada único do AI Copilot — escolhe entre o orchestrator real
 * (Vercel AI SDK + Anthropic/OpenAI) e o demo (determinístico, sem chamada de
 * rede), com a mesma lógica de fallback usada em @nexus/integrations
 * (resolveAdapter): DEMO_MODE=true ou ausência de credencial sempre cai para
 * o caminho demo, nunca falha por falta de configuração.
 */
export async function runCopilotQuery(input: RunCopilotQueryInput): Promise<RunCopilotQueryResult> {
  const model = input.demoMode ? null : selectModel(input.env);

  if (!model) {
    const response = await runDemoOrchestrator({
      question: input.question,
      knownServiceSlugs: input.knownServiceSlugs,
      readExecutors: input.readExecutors,
    });
    return { ...response, usingMock: true, model: "demo-orchestrator" };
  }

  const response = await runRealOrchestrator({
    question: input.question,
    readExecutors: input.readExecutors,
    model,
  });
  return { ...response, usingMock: false, model: `${model.provider}:${model.modelId}` };
}
