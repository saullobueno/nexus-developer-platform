import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  isMutating: boolean;
}

/**
 * Ferramentas somente-leitura do AI Copilot (spec seção 19, "Read-only tools").
 * Cada uma mapeia para uma query já existente no backend — o Copilot nunca lê
 * dados que a aplicação REST não exporia normalmente ao usuário.
 */
export const READ_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_service",
    description: "Retorna os detalhes de um serviço do catálogo pelo slug (owner, lifecycle, linguagem, dependências).",
    inputSchema: z.object({ slug: z.string() }),
    isMutating: false,
  },
  {
    name: "get_service_dependencies",
    description: "Lista os serviços dos quais um serviço depende e os que dependem dele.",
    inputSchema: z.object({ slug: z.string() }),
    isMutating: false,
  },
  {
    name: "get_service_deployments",
    description: "Lista os deployments mais recentes de um serviço.",
    inputSchema: z.object({ slug: z.string(), limit: z.number().int().min(1).max(50).optional() }),
    isMutating: false,
  },
  {
    name: "get_service_metrics",
    description: "Retorna as métricas de observability (request rate, latência, error rate) de um serviço nas últimas 24h.",
    inputSchema: z.object({ slug: z.string() }),
    isMutating: false,
  },
  {
    name: "search_logs",
    description: "Busca logs recentes, opcionalmente filtrando por serviço, nível ou trace ID.",
    inputSchema: z.object({
      service: z.string().optional(),
      level: z.string().optional(),
      traceId: z.string().optional(),
    }),
    isMutating: false,
  },
  {
    name: "get_trace",
    description: "Retorna um trace distribuído (spans) pelo ID.",
    inputSchema: z.object({ id: z.string() }),
    isMutating: false,
  },
  {
    name: "get_incident",
    description: "Retorna os detalhes completos de um incidente pelo ID.",
    inputSchema: z.object({ id: z.string() }),
    isMutating: false,
  },
  {
    name: "get_related_incidents",
    description: "Lista incidentes recentes, opcionalmente filtrando por serviço afetado.",
    inputSchema: z.object({ service: z.string().optional() }),
    isMutating: false,
  },
  {
    name: "search_documentation",
    description: "Busca documentos (runbooks, arquitetura, getting started) por título.",
    inputSchema: z.object({ query: z.string() }),
    isMutating: false,
  },
  {
    name: "get_team",
    description: "Retorna os detalhes de um time (membros, serviços, KPIs) pelo slug.",
    inputSchema: z.object({ slug: z.string() }),
    isMutating: false,
  },
  {
    name: "get_pipeline",
    description: "Retorna o pipeline de CI de um serviço e sua execução mais recente.",
    inputSchema: z.object({ service: z.string() }),
    isMutating: false,
  },
  {
    name: "get_feature_flag",
    description: "Retorna o estado e as regras de rollout de uma feature flag pela key.",
    inputSchema: z.object({ key: z.string() }),
    isMutating: false,
  },
];

/**
 * Ferramentas que alteram estado (spec seção 19, "Mutating tools"). O Copilot
 * nunca as executa diretamente — apenas as propõe como `suggestedActions`;
 * a execução real só acontece depois de aprovação humana explícita (ver
 * AiCopilotService.approveAction em apps/api).
 */
export const MUTATING_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "rollback_deployment",
    description: "Reverte um deployment para a versão anterior bem-sucedida.",
    inputSchema: z.object({ deploymentId: z.string() }),
    isMutating: true,
  },
  {
    name: "create_incident",
    description: "Cria um novo incidente para um ou mais serviços afetados.",
    inputSchema: z.object({
      title: z.string(),
      summary: z.string(),
      severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
      serviceIds: z.array(z.string()).min(1),
    }),
    isMutating: true,
  },
  {
    name: "update_feature_flag",
    description: "Ativa ou desativa uma feature flag.",
    inputSchema: z.object({ key: z.string(), enabled: z.boolean() }),
    isMutating: true,
  },
  {
    name: "trigger_deployment",
    description: "Refaz (retry) um deployment que falhou.",
    inputSchema: z.object({ deploymentId: z.string() }),
    isMutating: true,
  },
];

export const ALL_TOOL_DEFINITIONS: ToolDefinition[] = [...READ_TOOL_DEFINITIONS, ...MUTATING_TOOL_DEFINITIONS];
