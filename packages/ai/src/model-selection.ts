export interface ModelSelection {
  provider: "anthropic" | "openai";
  modelId: string;
}

/**
 * Escolhe o provider/modelo a partir de variáveis de ambiente. Prefere
 * Anthropic quando ambas as chaves estão presentes. Retorna `null` quando
 * nenhuma credencial existe — nesse caso o orchestrator cai para o modo demo
 * (ver orchestrator.ts), nunca tenta chamar um provider sem chave.
 */
export function selectModel(env: NodeJS.ProcessEnv = process.env): ModelSelection | null {
  if (env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", modelId: env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5" };
  }
  if (env.OPENAI_API_KEY) {
    return { provider: "openai", modelId: env.OPENAI_MODEL ?? "gpt-5" };
  }
  return null;
}
