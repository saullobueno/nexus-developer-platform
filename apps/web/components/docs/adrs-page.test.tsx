import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdrsPage } from "./adrs-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/docs/adrs",
}));

const useAdrsMock = vi.fn();
vi.mock("../../hooks/use-adrs", () => ({
  useAdrs: (...args: unknown[]) => useAdrsMock(...args),
}));

describe("AdrsPage", () => {
  it("mostra o estado vazio", () => {
    useAdrsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<AdrsPage />);
    expect(screen.getByText("Nenhuma ADR encontrada com esses filtros.")).toBeInTheDocument();
  });

  it("lista as ADRs com link para o detalhe", () => {
    useAdrsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          { id: "adr1", title: "Escolha de mensageria", status: "accepted", createdAt: new Date().toISOString() },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<AdrsPage />);
    const link = screen.getByRole("link", { name: "Escolha de mensageria" });
    expect(link).toHaveAttribute("href", "/docs/adrs/adr1");
    expect(within(link.closest("li")!).getByText("accepted")).toBeInTheDocument();
  });
});
