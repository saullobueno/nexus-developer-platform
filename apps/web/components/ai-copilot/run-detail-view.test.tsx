import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { RunDetailView } from "./run-detail-view";

const useAiRunDetailMock = vi.fn();
vi.mock("../../hooks/use-ai-run-detail", () => ({
  useAiRunDetail: (...args: unknown[]) => useAiRunDetailMock(...args),
}));

vi.mock("../../lib/ai-copilot", () => ({
  approveAction: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("RunDetailView", () => {
  it("mostra o estado de loading", () => {
    useAiRunDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<RunDetailView runId="r1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando execução...");
  });

  it("mostra o resumo, a evidência e as ações pendentes", () => {
    useAiRunDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        run: { id: "r1", model: "demo-orchestrator", status: "requires_approval", confidence: 0.75 },
        messages: [{ id: "m1", role: "assistant", content: "payments-api está degradado.", createdAt: "" }],
        evidence: [
          { id: "e1", toolName: "get_service_metrics", input: { slug: "payments-api" }, output: {}, isMutating: false, approvedAt: null, createdAt: "" },
        ],
        pendingActions: [
          {
            id: "a1",
            toolName: "rollback_deployment",
            input: { deploymentId: "d1" },
            output: null,
            isMutating: true,
            approvedAt: null,
            createdAt: "",
          },
        ],
        approvedActions: [],
      },
    });
    renderWithQueryClient(<RunDetailView runId="r1" />);

    expect(screen.getByText("payments-api está degradado.")).toBeInTheDocument();
    expect(screen.getByText("get_service_metrics")).toBeInTheDocument();
    expect(screen.getByText("rollback_deployment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
  });
});
