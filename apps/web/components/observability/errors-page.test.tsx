import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorsPage } from "./errors-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/observability/errors",
}));

const useErrorsMock = vi.fn();
vi.mock("../../hooks/use-errors", () => ({
  useErrors: (...args: unknown[]) => useErrorsMock(...args),
}));

describe("ErrorsPage", () => {
  it("mostra o estado vazio", () => {
    useErrorsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<ErrorsPage />);
    expect(screen.getByText("Nenhum error registrado.")).toBeInTheDocument();
  });

  it("lista os error events agrupados", () => {
    useErrorsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "e1",
            type: "TimeoutError",
            message: "Request timed out",
            occurrences: 12,
            affectedUsers: 4,
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            serviceName: "payments-api",
            serviceSlug: "payments-api",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<ErrorsPage />);
    expect(screen.getByText("TimeoutError")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
