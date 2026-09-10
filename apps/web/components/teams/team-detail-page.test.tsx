import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TeamDetailPage } from "./team-detail-page";

const useTeamDetailMock = vi.fn();
vi.mock("../../hooks/use-team-detail", () => ({
  useTeamDetail: (...args: unknown[]) => useTeamDetailMock(...args),
}));

const detail = {
  team: { id: "t1", name: "Payments", slug: "payments", description: "Processamento de pagamentos." },
  members: [{ id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test" }],
  services: [{ id: "s1", name: "payments-api", slug: "payments-api", lifecycle: "production" }],
  apis: [{ id: "a1", name: "payments-api", slug: "payments-api", protocol: "rest" }],
  documents: [{ id: "d1", title: "Arquitetura de Pagamentos", slug: "arquitetura-de-pagamentos", category: "architecture" }],
  incidents: [],
  deployments: [
    { id: "dep1", version: "1.4.0", status: "successful", createdAt: new Date().toISOString(), serviceId: "s1" },
  ],
  kpis: {
    servicesCount: 1,
    deploymentsCount30d: 6,
    incidentsCount30d: 0,
    uptimeAvg: 99.5,
    mttrHours: 2.3,
    deploymentFrequencyPerWeek: 1.4,
  },
};

describe("TeamDetailPage", () => {
  it("mostra o estado de loading", () => {
    useTeamDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<TeamDetailPage slug="payments" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando time...");
  });

  it("mostra os KPIs e permite trocar de tab", async () => {
    useTeamDetailMock.mockReturnValue({ isLoading: false, isError: false, data: detail });
    const user = userEvent.setup();
    render(<TeamDetailPage slug="payments" />);

    expect(screen.getByRole("heading", { name: "Payments" })).toBeInTheDocument();
    expect(screen.getByText("99.5")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Services" }));
    expect(screen.getByRole("link", { name: "payments-api" })).toHaveAttribute(
      "href",
      "/catalog/services/payments-api",
    );
  });
});
