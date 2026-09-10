import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentDetailPage } from "./document-detail-page";

const useDocumentDetailMock = vi.fn();
vi.mock("../../hooks/use-document-detail", () => ({
  useDocumentDetail: (...args: unknown[]) => useDocumentDetailMock(...args),
}));

describe("DocumentDetailPage", () => {
  it("mostra o estado de loading", () => {
    useDocumentDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<DocumentDetailPage slug="arquitetura-de-pagamentos" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando documento...");
  });

  it("renderiza o conteúdo markdown do documento", () => {
    useDocumentDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        document: {
          id: "d1",
          title: "Arquitetura de Pagamentos",
          slug: "arquitetura-de-pagamentos",
          category: "architecture",
          content: "## Visão Geral\n\npayments-api concentra a integração.",
          updatedAt: new Date().toISOString(),
        },
        author: { id: "u1", name: "Admin Acme" },
        service: { id: "s1", name: "payments-api", slug: "payments-api" },
        versions: [],
      },
    });
    render(<DocumentDetailPage slug="arquitetura-de-pagamentos" />);

    expect(screen.getByRole("heading", { name: "Arquitetura de Pagamentos", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/payments-api concentra a integração/)).toBeInTheDocument();
    expect(screen.getByText(/Admin Acme/)).toBeInTheDocument();
  });
});
