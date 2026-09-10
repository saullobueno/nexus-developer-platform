import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TracesPage } from "./traces-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/observability/traces",
}));

const useTracesMock = vi.fn();
vi.mock("../../hooks/use-traces", () => ({
  useTraces: (...args: unknown[]) => useTracesMock(...args),
}));

describe("TracesPage", () => {
  it("mostra o estado vazio", () => {
    useTracesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<TracesPage />);
    expect(screen.getByText("Nenhum trace registrado ainda.")).toBeInTheDocument();
  });

  it("lista os traces com link para o detalhe", () => {
    useTracesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "t1",
            traceId: "abc123",
            durationMs: 480,
            startedAt: new Date().toISOString(),
            serviceName: "checkout-web",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<TracesPage />);
    const link = screen.getByRole("link", { name: "abc123" });
    expect(link).toHaveAttribute("href", "/observability/traces/t1");
  });
});
