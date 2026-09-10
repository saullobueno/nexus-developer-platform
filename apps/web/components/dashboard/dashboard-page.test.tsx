import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard-page";

const useDashboardSummaryMock = vi.fn();
vi.mock("../../hooks/use-dashboard-summary", () => ({
  useDashboardSummary: () => useDashboardSummaryMock(),
}));

describe("DashboardPage", () => {
  it("mostra o estado de loading", () => {
    useDashboardSummaryMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<DashboardPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando dashboard...");
  });

  it("mostra o estado de erro com botão de retry", async () => {
    const refetch = vi.fn();
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(screen.getByText("Não foi possível carregar o dashboard.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renderiza os dados quando a busca tem sucesso", () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        kpis: {
          servicesCount: 8,
          deploymentsToday: 2,
          activeIncidents: 1,
          failedDeployments: 0,
          uptimePercentage: 100,
          sloCompliance: 100,
        },
        myServices: [],
        recentDeployments: [],
        activeIncidents: [],
      },
    });

    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("AI Insights")).toBeInTheDocument();
  });
});
