import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogsPage } from "./logs-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/observability/logs",
}));

const useObservabilityLogsMock = vi.fn();
vi.mock("../../hooks/use-observability-logs", () => ({
  useObservabilityLogs: (...args: unknown[]) => useObservabilityLogsMock(...args),
}));

describe("LogsPage", () => {
  it("mostra o estado de loading", () => {
    useObservabilityLogsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<LogsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando logs...");
  });

  it("mostra o estado vazio", () => {
    useObservabilityLogsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 50 },
    });
    render(<LogsPage />);
    expect(screen.getByText("Nenhum log encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os logs quando a busca tem sucesso", () => {
    useObservabilityLogsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "1",
            level: "error",
            message: "Timeout no downstream",
            traceId: "abc123",
            timestamp: new Date().toISOString(),
            serviceName: "payments-api",
            serviceSlug: "payments-api",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
      },
    });
    render(<LogsPage />);
    expect(screen.getByText("Timeout no downstream")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });
});
