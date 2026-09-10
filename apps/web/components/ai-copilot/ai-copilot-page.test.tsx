import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { AiCopilotPage } from "./ai-copilot-page";

const askCopilotMock = vi.fn();
vi.mock("../../lib/ai-copilot", () => ({
  askCopilot: (...args: unknown[]) => askCopilotMock(...args),
  getAiRunById: vi.fn(),
  listAiRuns: vi.fn().mockResolvedValue([]),
  approveAction: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AiCopilotPage", () => {
  it("preenche a pergunta ao clicar num exemplo", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AiCopilotPage />);

    await user.click(screen.getByRole("button", { name: "Who owns identity-api?" }));
    expect(screen.getByLabelText("Pergunta")).toHaveValue("Who owns identity-api?");
  });

  it("chama askCopilot ao perguntar", async () => {
    askCopilotMock.mockResolvedValue({
      run: { id: "r1", model: "demo-orchestrator", status: "completed" },
      summary: "resumo",
      findings: [],
      evidence: [],
      confidence: 0.8,
      suggestedActions: [],
      requiresApproval: false,
      usingMock: true,
      model: "demo-orchestrator",
    });
    const user = userEvent.setup();
    renderWithQueryClient(<AiCopilotPage />);

    await user.type(screen.getByLabelText("Pergunta"), "Who owns payments-api?");
    await user.click(screen.getByRole("button", { name: "Perguntar" }));

    expect(askCopilotMock).toHaveBeenCalledWith("Who owns payments-api?");
  });
});
