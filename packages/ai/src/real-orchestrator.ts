import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import type { ModelSelection } from "./model-selection.js";
import { MUTATING_TOOL_DEFINITIONS, READ_TOOL_DEFINITIONS } from "./tool-definitions.js";
import type { CopilotResponse, Evidence, Finding, SuggestedAction, ToolExecutor } from "./types.js";

export interface RealOrchestratorInput {
  question: string;
  readExecutors: Partial<Record<string, ToolExecutor>>;
  model: ModelSelection;
}

const SYSTEM_PROMPT =
  "Você é o Nexus AI Engineering Copilot. Responda perguntas sobre serviços, deployments, incidentes, " +
  "métricas, logs, traces, documentação, times e feature flags usando APENAS as ferramentas disponíveis. " +
  "Nunca invente dados: se as ferramentas não retornarem evidência suficiente, diga isso explicitamente. Seja conciso.";

function resolveModel(selection: ModelSelection) {
  return selection.provider === "anthropic" ? anthropic(selection.modelId) : openai(selection.modelId);
}

function isSuggestedAction(value: unknown): value is SuggestedAction {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.tool === "string" && typeof candidate.description === "string";
}

/**
 * Orchestrator real: usa o Vercel AI SDK (generateText + tool-calling) contra
 * Anthropic ou OpenAI. Só é chamado quando `selectModel()` encontra uma
 * credencial configurada — nunca em DEMO_MODE (ver orchestrator.ts). Não é
 * exercitado pelos testes automatizados deste projeto (nenhuma chave real
 * disponível no ambiente de CI/dev) — ver ADR da Phase 15.
 */
export async function runRealOrchestrator(input: RealOrchestratorInput): Promise<CopilotResponse> {
  const model = resolveModel(input.model);
  const evidence: Evidence[] = [];

  const tools = Object.fromEntries(
    READ_TOOL_DEFINITIONS.filter((definition) => input.readExecutors[definition.name]).map((definition) => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: definition.inputSchema,
        execute: async (rawInput: Record<string, unknown>) => {
          const executor = input.readExecutors[definition.name]!;
          const output = await executor(rawInput);
          evidence.push({ tool: definition.name, input: rawInput, output });
          return output;
        },
      }),
    ]),
  );

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: input.question,
    tools,
    stopWhen: stepCountIs(5),
  });

  const mutatingCatalog = MUTATING_TOOL_DEFINITIONS.map(
    (definition) => `- ${definition.name}: ${definition.description}`,
  ).join("\n");
  const actionPrompt =
    `Com base na análise a seguir, recomende ações corretivas apenas se realmente necessário.\n\n` +
    `Análise:\n${result.text}\n\n` +
    `Ações disponíveis (não execute, apenas recomende):\n${mutatingCatalog}\n\n` +
    `Responda APENAS com um array JSON (vazio se nenhuma ação for necessária), no formato ` +
    `[{"tool": string, "input": object, "description": string}].`;

  let suggestedActions: SuggestedAction[] = [];
  try {
    const actionResult = await generateText({ model, prompt: actionPrompt });
    const parsed: unknown = JSON.parse(actionResult.text.trim());
    if (Array.isArray(parsed)) {
      suggestedActions = parsed.filter(isSuggestedAction);
    }
  } catch {
    suggestedActions = [];
  }

  const findings: Finding[] = evidence.map((item) => ({
    title: item.tool,
    detail: `Ferramenta ${item.tool} executada com sucesso.`,
  }));

  return {
    summary: result.text,
    findings,
    evidence,
    confidence: evidence.length > 0 ? 0.7 : 0.2,
    suggestedActions,
    requiresApproval: suggestedActions.length > 0,
  };
}
