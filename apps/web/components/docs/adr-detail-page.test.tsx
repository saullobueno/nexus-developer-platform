import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdrDetailPage } from "./adr-detail-page";

const useAdrDetailMock = vi.fn();
vi.mock("../../hooks/use-adr-detail", () => ({
  useAdrDetail: (...args: unknown[]) => useAdrDetailMock(...args),
}));

describe("AdrDetailPage", () => {
  it("mostra o estado de loading", () => {
    useAdrDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<AdrDetailPage id="adr1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando ADR...");
  });

  it("renderiza as seções da ADR", () => {
    useAdrDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: "adr1",
        title: "Escolha de mensageria",
        status: "accepted",
        context: "Contexto do problema.",
        decision: "Decisão tomada.",
        consequences: "Consequências esperadas.",
        alternatives: "Alternativas descartadas.",
        createdAt: new Date().toISOString(),
      },
    });
    render(<AdrDetailPage id="adr1" />);

    expect(screen.getByRole("heading", { name: "Escolha de mensageria" })).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(screen.getByText("Decisão tomada.")).toBeInTheDocument();
    expect(screen.getByText("Alternativas descartadas.")).toBeInTheDocument();
  });
});
