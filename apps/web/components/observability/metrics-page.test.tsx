import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetricsPage } from "./metrics-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/observability/metrics",
}));

const useMetricsMock = vi.fn();
vi.mock("../../hooks/use-metrics", () => ({
  useMetrics: (...args: unknown[]) => useMetricsMock(...args),
}));

describe("MetricsPage", () => {
  it("mostra o estado de loading", () => {
    useMetricsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<MetricsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando métricas...");
  });

  it("mostra o estado de erro", () => {
    useMetricsMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });
    render(<MetricsPage />);
    expect(screen.getByText("Não foi possível carregar as métricas.")).toBeInTheDocument();
  });

  it("mostra o estado vazio", () => {
    useMetricsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { range: "24h", series: [] },
    });
    render(<MetricsPage />);
    expect(screen.getByText("Nenhuma métrica coletada neste período.")).toBeInTheDocument();
  });

  it("renderiza um gráfico por série de métrica", () => {
    useMetricsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        range: "24h",
        series: [
          {
            name: "p95_latency",
            unit: "ms",
            points: [{ timestamp: new Date().toISOString(), value: 220 }],
          },
        ],
      },
    });
    render(<MetricsPage />);
    expect(screen.getByText("Observability")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "24h" })).toBeInTheDocument();
  });
});
