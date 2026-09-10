import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeploymentsPage } from "./deployments-page";

const useDeploymentsMock = vi.fn();
vi.mock("../../hooks/use-deployments", () => ({
  useDeployments: (...args: unknown[]) => useDeploymentsMock(...args),
}));

describe("DeploymentsPage", () => {
  it("mostra o estado de loading", () => {
    useDeploymentsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<DeploymentsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando deployments...");
  });

  it("mostra o estado de erro", () => {
    useDeploymentsMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    render(<DeploymentsPage />);
    expect(screen.getByText("Não foi possível carregar os deployments.")).toBeInTheDocument();
  });

  it("mostra o estado vazio", () => {
    useDeploymentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<DeploymentsPage />);
    expect(screen.getByText("Nenhum deployment encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os deployments quando a busca tem sucesso", () => {
    useDeploymentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "d1",
            version: "1.4.0",
            status: "successful",
            commitSha: "abc1234",
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: 60000,
            createdAt: new Date().toISOString(),
            serviceName: "payments-api",
            serviceSlug: "payments-api",
            environmentName: "Production",
            authorName: "Bruno Alves",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<DeploymentsPage />);
    expect(screen.getByRole("link", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByText("Successful")).toBeInTheDocument();
  });
});
