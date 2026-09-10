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

export interface CopilotResponse {
  summary: string;
  findings: Finding[];
  evidence: Evidence[];
  confidence: number;
  suggestedActions: SuggestedAction[];
  requiresApproval: boolean;
}

export type ToolExecutor = (input: Record<string, unknown>) => Promise<unknown>;
