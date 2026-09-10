import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeploymentDetailPage } from "./deployment-detail-page";

const useDeploymentDetailMock = vi.fn();
vi.mock("../../hooks/use-deployment-detail", () => ({
  useDeploymentDetail: (...args: unknown[]) => useDeploymentDetailMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("DeploymentDetailPage", () => {
  it("mostra o estado de loading", () => {
    useDeploymentDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<DeploymentDetailPage id="d1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando deployment...");
  });

  it("mostra o estado de erro", () => {
    useDeploymentDetailMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    renderWithQueryClient(<DeploymentDetailPage id="d1" />);
    expect(screen.getByText("Não foi possível carregar este deployment.")).toBeInTheDocument();
  });

  it("renderiza o timeline, os logs e as ações disponíveis", () => {
    useDeploymentDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        deployment: {
          id: "d1",
          version: "1.4.0",
          status: "failed",
          commitSha: "abc1234",
          commitMessage: "fix: corrige bug",
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: 60000,
          createdAt: new Date().toISOString(),
        },
        service: { id: "s1", name: "payments-api", slug: "payments-api" },
        environment: { id: "e1", name: "Production" },
        author: { id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test" },
        logs: [{ id: "l1", level: "error", message: "Falhou no deploy", timestamp: new Date().toISOString() }],
        stages: [
          { id: "st1", name: "Build", order: 0, status: "success", startedAt: null, finishedAt: null, durationMs: null },
          { id: "st2", name: "Tests", order: 1, status: "failed", startedAt: null, finishedAt: null, durationMs: null },
        ],
      },
    });

    renderWithQueryClient(<DeploymentDetailPage id="d1" />);

    expect(screen.getByRole("heading", { name: /payments-api/ })).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Falhou no deploy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
