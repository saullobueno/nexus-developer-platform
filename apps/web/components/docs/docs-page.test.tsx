import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocsPage } from "./docs-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/docs",
}));

const useDocumentsMock = vi.fn();
vi.mock("../../hooks/use-documents", () => ({
  useDocuments: (...args: unknown[]) => useDocumentsMock(...args),
}));

describe("DocsPage", () => {
  it("mostra o estado de loading", () => {
    useDocumentsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<DocsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando documentos...");
  });

  it("mostra o estado vazio", () => {
    useDocumentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<DocsPage />);
    expect(screen.getByText("Nenhum documento encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os documentos quando a busca tem sucesso", () => {
    useDocumentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "d1",
            title: "Arquitetura de Pagamentos",
            slug: "arquitetura-de-pagamentos",
            category: "architecture",
            updatedAt: new Date().toISOString(),
            serviceName: "payments-api",
            serviceSlug: "payments-api",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<DocsPage />);
    expect(screen.getByRole("link", { name: "Arquitetura de Pagamentos" })).toHaveAttribute(
      "href",
      "/docs/arquitetura-de-pagamentos",
    );
  });
});
