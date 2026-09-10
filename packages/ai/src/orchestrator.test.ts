import { describe, expect, it, vi } from "vitest";
import { runCopilotQuery } from "./orchestrator";
import { runRealOrchestrator } from "./real-orchestrator";

vi.mock("./real-orchestrator", () => ({
  runRealOrchestrator: vi.fn().mockResolvedValue({
    summary: "real",
    findings: [],
    evidence: [],
    confidence: 0.7,
    suggestedActions: [],
    requiresApproval: false,
  }),
}));

describe("runCopilotQuery", () => {
  it("usa o orchestrator demo quando demoMode é true, mesmo com credenciais presentes", async () => {
    const result = await runCopilotQuery({
      question: "Who owns payments-api?",
      knownServiceSlugs: ["payments-api"],
      readExecutors: {},
      demoMode: true,
      env: { ANTHROPIC_API_KEY: "a" },
    });

    expect(result.usingMock).toBe(true);
    expect(result.model).toBe("demo-orchestrator");
    expect(runRealOrchestrator).not.toHaveBeenCalled();
  });

  it("usa o orchestrator demo quando não há nenhuma credencial configurada", async () => {
    const result = await runCopilotQuery({
      question: "Who owns payments-api?",
      knownServiceSlugs: ["payments-api"],
      readExecutors: {},
      demoMode: false,
      env: {},
    });

    expect(result.usingMock).toBe(true);
    expect(runRealOrchestrator).not.toHaveBeenCalled();
  });

  it("usa o orchestrator real quando demoMode é false e há credencial configurada", async () => {
    const result = await runCopilotQuery({
      question: "Who owns payments-api?",
      knownServiceSlugs: ["payments-api"],
      readExecutors: {},
      demoMode: false,
      env: { ANTHROPIC_API_KEY: "a" },
    });

    expect(result.usingMock).toBe(false);
    expect(result.model).toBe("anthropic:claude-sonnet-4-5");
    expect(runRealOrchestrator).toHaveBeenCalled();
  });
});
