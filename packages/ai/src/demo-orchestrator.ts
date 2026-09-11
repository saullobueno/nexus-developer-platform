import type { CopilotResponse, Evidence, Finding, SuggestedAction, ToolExecutor } from "./types.js";

export interface DemoOrchestratorInput {
  question: string;
  knownServiceSlugs: string[];
  readExecutors: Partial<Record<string, ToolExecutor>>;
}

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

interface PlannedCall {
  tool: string;
  input: Record<string, unknown>;
}

function findServiceSlug(question: string, knownServiceSlugs: string[]): string | undefined {
  const lower = question.toLowerCase();
  return knownServiceSlugs.find((slug) => lower.includes(slug.toLowerCase()));
}

function planCalls(question: string, knownServiceSlugs: string[]): PlannedCall[] {
  const lower = question.toLowerCase();
  const uuidMatch = question.match(UUID_PATTERN);
  if (uuidMatch) {
    return [{ tool: "get_incident", input: { id: uuidMatch[0] } }];
  }

  const slug = findServiceSlug(question, knownServiceSlugs);

  if (/slow|latency|degraded|performance|p95|p99/.test(lower) && slug) {
    return [
      { tool: "get_service_metrics", input: { slug } },
      { tool: "get_service_deployments", input: { slug } },
    ];
  }
  if (/owns|owner|who owns/.test(lower) && slug) {
    return [{ tool: "get_service", input: { slug } }];
  }
  if (/architecture|explain|how does/.test(lower) && slug) {
    return [
      { tool: "get_service", input: { slug } },
      { tool: "get_service_dependencies", input: { slug } },
    ];
  }
  if (/caused|which deployment|deployment/.test(lower) && slug) {
    return [{ tool: "get_service_deployments", input: { slug } }];
  }
  if (/incident|changed before/.test(lower)) {
    return [{ tool: "get_related_incidents", input: slug ? { service: slug } : {} }];
  }
  if (slug) {
    return [{ tool: "get_service", input: { slug } }];
  }
  return [];
}

function isEmptyOutput(output: unknown): boolean {
  if (output === null || output === undefined) return true;
  if (Array.isArray(output)) return output.length === 0;
  if (typeof output === "object") {
    const record = output as Record<string, unknown>;
    if ("items" in record && Array.isArray(record.items)) return record.items.length === 0;
  }
  return false;
}

function describeOutput(tool: string, output: unknown): string {
  if (isEmptyOutput(output)) return "Nenhum dado retornado.";
  if (Array.isArray(output)) return `${output.length} resultado(s) encontrado(s).`;
  if (typeof output === "object" && output !== null) {
    const record = output as Record<string, unknown>;
    if ("items" in record && Array.isArray(record.items)) {
      return `${record.items.length} resultado(s) encontrado(s).`;
    }
    const keys = Object.keys(record).slice(0, 5);
    return `Dados retornados: ${keys.join(", ")}${Object.keys(record).length > 5 ? "…" : ""}.`;
  }
  return `Resultado: ${String(output)}.`;
}

function proposeActions(evidence: Evidence[], question: string): SuggestedAction[] {
  const lower = question.toLowerCase();
  if (!/slow|degraded|error|caused|fix|latency/.test(lower)) return [];

  const deploymentsEvidence = evidence.find((item) => item.tool === "get_service_deployments");
  if (!deploymentsEvidence) return [];

  const output = deploymentsEvidence.output as { items?: Array<{ id: string; status: string }> } | undefined;
  const latest = output?.items?.[0];
  if (!latest || latest.status !== "successful") return [];

  return [
    {
      tool: "rollback_deployment",
      input: { deploymentId: latest.id },
      description: `Reverter o deployment mais recente (${latest.id}), suspeito de causar a degradação.`,
    },
  ];
}

export async function runDemoOrchestrator(input: DemoOrchestratorInput): Promise<CopilotResponse> {
  const calls = planCalls(input.question, input.knownServiceSlugs);

  if (calls.length === 0) {
    return {
      summary:
        "Não consegui identificar um serviço, incidente ou entidade conhecida na pergunta. Tente citar o nome do serviço (ex.: payments-api) ou o ID do incidente.",
      findings: [],
      evidence: [],
      confidence: 0,
      suggestedActions: [],
      requiresApproval: false,
    };
  }

  const evidence: Evidence[] = [];
  for (const call of calls) {
    const executor = input.readExecutors[call.tool];
    if (!executor) continue;
    try {
      const output = await executor(call.input);
      evidence.push({ tool: call.tool, input: call.input, output });
    } catch (error) {
      evidence.push({
        tool: call.tool,
        input: call.input,
        output: { error: error instanceof Error ? error.message : "Erro desconhecido" },
      });
    }
  }

  const findings: Finding[] = evidence.map((item) => ({
    title: item.tool,
    detail: describeOutput(item.tool, item.output),
  }));

  const hasData = evidence.some((item) => !isEmptyOutput(item.output) && !(item.output as { error?: unknown })?.error);
  const confidence = evidence.length === 0 ? 0 : hasData ? 0.75 : 0.3;

  const suggestedActions = proposeActions(evidence, input.question);

  const toolNames = calls.map((call) => call.tool).join(", ");
  const summary = hasData
    ? `Consultei ${toolNames} para responder. ${findings.map((finding) => finding.detail).join(" ")}`
    : `Consultei ${toolNames}, mas não encontrei dados suficientes para uma resposta conclusiva.`;

  return {
    summary,
    findings,
    evidence,
    confidence,
    suggestedActions,
    requiresApproval: suggestedActions.length > 0,
  };
}
