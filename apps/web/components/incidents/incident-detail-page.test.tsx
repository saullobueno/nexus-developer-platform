import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { IncidentDetailPage } from "./incident-detail-page";

const useIncidentDetailMock = vi.fn();
vi.mock("../../hooks/use-incident-detail", () => ({
  useIncidentDetail: (...args: unknown[]) => useIncidentDetailMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const detail = {
  incident: {
    id: "i1",
    title: "Latência elevada em payments-api",
    summary: "Investigação em andamento.",
    severity: "sev2",
    status: "monitoring",
    postmortem: null,
    detectedAt: new Date().toISOString(),
    resolvedAt: null,
  },
  owner: { id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test" },
  services: [{ serviceId: "s1", name: "payments-api", slug: "payments-api", impact: "Latência alta" }],
  events: [
    {
      id: "e1",
      type: "detected",
      message: "Incidente detectado",
      createdAt: new Date().toISOString(),
      authorName: "Bruno Alves",
    },
  ],
  relatedDeployments: [
    { id: "d1", version: "1.4.0", status: "successful", createdAt: new Date().toISOString(), serviceId: "s1" },
  ],
  logs: [{ id: "l1", level: "error", message: "Timeout no downstream", timestamp: new Date().toISOString(), serviceId: "s1" }],
  metrics: [{ name: "p95_latency", value: 420, unit: "ms", timestamp: new Date().toISOString(), serviceId: "s1" }],
};

describe("IncidentDetailPage", () => {
  it("mostra o estado de loading", () => {
    useIncidentDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<IncidentDetailPage id="i1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando incidente...");
  });

  it("mostra o estado de erro", () => {
    useIncidentDetailMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    renderWithQueryClient(<IncidentDetailPage id="i1" />);
    expect(screen.getByText("Não foi possível carregar este incidente.")).toBeInTheDocument();
  });

  it("renderiza serviços afetados, deployments relacionados, logs e timeline", () => {
    useIncidentDetailMock.mockReturnValue({ isLoading: false, isError: false, data: detail });
    renderWithQueryClient(<IncidentDetailPage id="i1" />);

    expect(screen.getByRole("heading", { name: "Latência elevada em payments-api" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "v1.4.0" })).toBeInTheDocument();
    expect(screen.getByText("Timeout no downstream")).toBeInTheDocument();
    expect(screen.getByText("Incidente detectado")).toBeInTheDocument();
  });
});
