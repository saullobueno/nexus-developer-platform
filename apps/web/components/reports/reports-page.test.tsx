import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReportsPage } from "./reports-page";

const useReportsMock = vi.fn();
vi.mock("../../hooks/use-reports", () => ({
  useReports: (...args: unknown[]) => useReportsMock(...args),
}));

const reports = {
  days: 30,
  dora: {
    deploymentFrequencyPerDay: 1.6,
    leadTimeForChangesHours: 0.8,
    changeFailureRate: 16.7,
    mttrHours: 3.2,
  },
  reliability: { uptimeAvg: 99.5, errorBudgetRemaining: -0.4, targetUptime: 99.9 },
  delivery: { totalDeployments: 48, failedDeployments: 8, rollbackRate: 12.5, avgPipelineDurationMs: 180000 },
};

describe("ReportsPage", () => {
  it("mostra o estado de loading", () => {
    useReportsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<ReportsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando reports...");
  });

  it("mostra as métricas de DORA, reliability e delivery", () => {
    useReportsMock.mockReturnValue({ isLoading: false, isError: false, data: reports });
    render(<ReportsPage />);

    expect(screen.getByText("DORA")).toBeInTheDocument();
    expect(screen.getByText("1.6")).toBeInTheDocument();
    expect(screen.getByText("Reliability")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("permite trocar o período", async () => {
    useReportsMock.mockReturnValue({ isLoading: false, isError: false, data: reports });
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(screen.getByRole("button", { name: "7d" }));
    expect(useReportsMock).toHaveBeenLastCalledWith(7);
  });
});
