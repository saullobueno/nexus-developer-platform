import { apiFetch } from "./api-client";

export interface Finding {
  title: string;
  detail: string;
}

export interface Evidence {
  tool: string;
  input: unknown;
  output: unknown;
}

export interface SuggestedAction {
  tool: string;
  input: Record<string, unknown>;
  description: string;
}

export interface AiAgentRun {
  id: string;
  model: string;
  status: string;
  summary: string | null;
  confidence: number | null;
  requiresApproval: boolean;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface AskResult {
  run: AiAgentRun;
  summary: string;
  findings: Finding[];
  evidence: Evidence[];
  confidence: number;
  suggestedActions: SuggestedAction[];
  requiresApproval: boolean;
  usingMock: boolean;
  model: string;
}

export function askCopilot(question: string): Promise<AskResult> {
  return apiFetch("/ai-copilot/ask", { method: "POST", body: JSON.stringify({ question }) });
}

export function listAiRuns(): Promise<AiAgentRun[]> {
  return apiFetch("/ai-copilot/runs");
}

export interface AiMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface AiToolCall {
  id: string;
  toolName: string;
  input: unknown;
  output: unknown;
  isMutating: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface AiRunDetail {
  run: AiAgentRun;
  messages: AiMessage[];
  evidence: AiToolCall[];
  pendingActions: AiToolCall[];
  approvedActions: AiToolCall[];
}

export function getAiRunById(id: string): Promise<AiRunDetail> {
  return apiFetch(`/ai-copilot/runs/${id}`);
}

export function approveAction(toolCallId: string): Promise<AiToolCall> {
  return apiFetch(`/ai-copilot/tool-calls/${toolCallId}/approve`, { method: "POST" });
}
