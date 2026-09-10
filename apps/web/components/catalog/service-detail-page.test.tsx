import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ServiceDetailPage } from "./service-detail-page";

const useServiceDetailMock = vi.fn();
vi.mock("../../hooks/use-service-detail", () => ({
  useServiceDetail: (...args: unknown[]) => useServiceDetailMock(...args),
}));

const detail = {
  service: {
    id: "1",
    name: "payments-api",
    slug: "payments-api",
    description: "Processa pagamentos.",
    type: "api",
    lifecycle: "production",
    language: "TypeScript",
    framework: "NestJS",
    runtime: "Node.js 22",
    repositoryUrl: "https://github.com/acme/payments-api",
    docsUrl: null,
    runbookUrl: null,
    dashboardUrl: null,
  },
  team: { id: "t1", name: "Payments", slug: "payments" },
  owners: [{ id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test" }],
  environments: [
    {
      id: "e1",
      name: "Production",
      slug: "production",
      health: "healthy",
      version: "1.4.0",
      replicas: 3,
      cpuUsage: 40,
      memoryUsage: 55,
      latencyMs: 120,
      errorRate: 0.2,
      lastDeployedAt: new Date().toISOString(),
    },
  ],
  recentDeployments: [
    {
      id: "d1",
      version: "1.4.0",
      status: "successful",
      createdAt: new Date().toISOString(),
      environmentName: "Production",
      authorName: "Bruno Alves",
    },
  ],
  dependencies: [{ id: "dep1", name: "PostgreSQL", isExternal: true }],
  dependents: [{ id: "svc2", name: "checkout-web", slug: "checkout-web" }],
  incidents: [],
  metrics: [{ name: "request_rate", value: 150, unit: "req/s", timestamp: new Date().toISOString() }],
  apis: [{ id: "api1", name: "payments-api", slug: "payments-api", protocol: "rest", status: "active" }],
};

describe("ServiceDetailPage", () => {
  it("mostra o estado de loading", () => {
    useServiceDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<ServiceDetailPage slug="payments-api" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando serviço...");
  });

  it("mostra o estado de erro", () => {
    useServiceDetailMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    render(<ServiceDetailPage slug="payments-api" />);
    expect(screen.getByText("Não foi possível carregar este serviço.")).toBeInTheDocument();
  });

  it("renderiza a Overview por padrão e permite trocar de tab", async () => {
    useServiceDetailMock.mockReturnValue({ isLoading: false, isError: false, data: detail });
    const user = userEvent.setup();
    render(<ServiceDetailPage slug="payments-api" />);

    expect(screen.getByRole("heading", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByText("Processa pagamentos.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Dependencies" }));
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });
});
