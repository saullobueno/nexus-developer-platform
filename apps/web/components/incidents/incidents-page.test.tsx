import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { IncidentsPage } from "./incidents-page";

const useIncidentsMock = vi.fn();
vi.mock("../../hooks/use-incidents", () => ({
  useIncidents: (...args: unknown[]) => useIncidentsMock(...args),
}));

const useServicesMock = vi.fn();
vi.mock("../../hooks/use-services", () => ({
  useServices: (...args: unknown[]) => useServicesMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("IncidentsPage", () => {
  it("mostra o estado de loading", () => {
    useServicesMock.mockReturnValue({ data: undefined });
    useIncidentsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<IncidentsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando incidentes...");
  });

  it("mostra o estado de erro", () => {
    useServicesMock.mockReturnValue({ data: undefined });
    useIncidentsMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    renderWithQueryClient(<IncidentsPage />);
    expect(screen.getByText("Não foi possível carregar os incidentes.")).toBeInTheDocument();
  });

  it("mostra o estado vazio", () => {
    useServicesMock.mockReturnValue({ data: undefined });
    useIncidentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    renderWithQueryClient(<IncidentsPage />);
    expect(screen.getByText("Nenhum incidente encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os incidentes quando a busca tem sucesso", () => {
    useServicesMock.mockReturnValue({ data: undefined });
    useIncidentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "i1",
            title: "Latência elevada em payments-api",
            severity: "sev2",
            status: "monitoring",
            detectedAt: new Date().toISOString(),
            resolvedAt: null,
            ownerName: "Bruno Alves",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    renderWithQueryClient(<IncidentsPage />);
    expect(
      screen.getByRole("link", { name: "Latência elevada em payments-api" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "SEV2" })).toBeInTheDocument();
  });
});
