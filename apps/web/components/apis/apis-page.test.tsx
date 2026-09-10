import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApisPage } from "./apis-page";

const useApisMock = vi.fn();
vi.mock("../../hooks/use-apis", () => ({
  useApis: (...args: unknown[]) => useApisMock(...args),
}));

describe("ApisPage", () => {
  it("mostra o estado de loading", () => {
    useApisMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<ApisPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando APIs...");
  });

  it("mostra o estado vazio", () => {
    useApisMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<ApisPage />);
    expect(screen.getByText("Nenhuma API encontrada com esses filtros.")).toBeInTheDocument();
  });

  it("lista as APIs quando a busca tem sucesso", () => {
    useApisMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "a1",
            name: "payments-api",
            slug: "payments-api",
            version: "1.0.0",
            status: "active",
            protocol: "rest",
            teamName: "Payments",
            serviceName: "payments-service",
            serviceSlug: "payments-service",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<ApisPage />);
    expect(screen.getByRole("link", { name: "payments-api" })).toHaveAttribute(
      "href",
      "/apis/payments-api",
    );
  });
});
