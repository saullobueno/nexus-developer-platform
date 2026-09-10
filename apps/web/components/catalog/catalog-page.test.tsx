import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CatalogPage } from "./catalog-page";

const useServicesMock = vi.fn();
vi.mock("../../hooks/use-services", () => ({
  useServices: (...args: unknown[]) => useServicesMock(...args),
}));

describe("CatalogPage", () => {
  it("mostra o estado de loading", () => {
    useServicesMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<CatalogPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando services...");
  });

  it("mostra o estado de erro com retry", () => {
    const refetch = vi.fn();
    useServicesMock.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch });
    render(<CatalogPage />);
    expect(screen.getByText("Não foi possível carregar o catálogo.")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há resultados", () => {
    useServicesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<CatalogPage />);
    expect(screen.getByText("Nenhum serviço encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os serviços quando a busca tem sucesso", () => {
    useServicesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "1",
            name: "payments-api",
            slug: "payments-api",
            type: "api",
            lifecycle: "production",
            language: "TypeScript",
            framework: "NestJS",
            teamName: "Payments",
            health: "healthy",
            version: "1.4.0",
            lastDeployedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<CatalogPage />);
    expect(screen.getByRole("link", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByText(/1 serviço/)).toBeInTheDocument();
  });
});
