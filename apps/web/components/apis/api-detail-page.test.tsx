import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiDetailPage } from "./api-detail-page";

const useApiDetailMock = vi.fn();
vi.mock("../../hooks/use-api-detail", () => ({
  useApiDetail: (...args: unknown[]) => useApiDetailMock(...args),
}));

const detail = {
  api: {
    id: "a1",
    name: "payments-api",
    slug: "payments-api",
    version: "1.0.0",
    status: "active",
    protocol: "rest",
    description: "API REST de payments-api.",
  },
  team: { id: "t1", name: "Payments", slug: "payments" },
  service: { id: "s1", name: "payments-api", slug: "payments-api" },
  health: { status: "healthy", latencyMs: 120, errorRate: 0.2 },
  endpoints: [
    { id: "e1", method: "GET", path: "/payments", description: "Lista recursos", requestSchema: null, responseSchema: null },
  ],
  consumers: [{ id: "c1", name: "checkout-web", consumerServiceName: "checkout-web", consumerServiceSlug: "checkout-web" }],
  documents: [{ id: "d1", title: "Arquitetura de Pagamentos", slug: "arquitetura-de-pagamentos", category: "architecture" }],
  activity: [],
};

describe("ApiDetailPage", () => {
  it("mostra o estado de loading", () => {
    useApiDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<ApiDetailPage slug="payments-api" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando API...");
  });

  it("mostra o estado de erro", () => {
    useApiDetailMock.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() });
    render(<ApiDetailPage slug="payments-api" />);
    expect(screen.getByText("Não foi possível carregar esta API.")).toBeInTheDocument();
  });

  it("renderiza a Overview por padrão e permite trocar de tab", async () => {
    useApiDetailMock.mockReturnValue({ isLoading: false, isError: false, data: detail });
    const user = userEvent.setup();
    render(<ApiDetailPage slug="payments-api" />);

    expect(screen.getByRole("heading", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByText("rest")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Endpoints" }));
    expect(screen.getByText("/payments")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Consumers" }));
    expect(screen.getByText("checkout-web")).toBeInTheDocument();
  });
});
