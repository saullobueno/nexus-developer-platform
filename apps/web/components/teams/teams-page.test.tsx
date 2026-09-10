import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamsPage } from "./teams-page";

const useTeamsMock = vi.fn();
vi.mock("../../hooks/use-teams", () => ({
  useTeams: (...args: unknown[]) => useTeamsMock(...args),
}));

describe("TeamsPage", () => {
  it("mostra o estado de loading", () => {
    useTeamsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<TeamsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando teams...");
  });

  it("mostra o estado vazio", () => {
    useTeamsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 50 },
    });
    render(<TeamsPage />);
    expect(screen.getByText("Nenhum team encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os teams com link para o detalhe", () => {
    useTeamsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "t1",
            name: "Payments",
            slug: "payments",
            description: "Processamento de pagamentos.",
            memberCount: 3,
            serviceCount: 2,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
      },
    });
    render(<TeamsPage />);
    expect(screen.getByRole("link", { name: /Payments/ })).toHaveAttribute("href", "/teams/payments");
  });
});
