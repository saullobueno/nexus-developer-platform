import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/",
}));

const useSessionMock = vi.fn();
vi.mock("../hooks/use-session", () => ({
  useSession: () => useSessionMock(),
}));

const useDashboardSummaryMock = vi.fn();
vi.mock("../hooks/use-dashboard-summary", () => ({
  useDashboardSummary: () => useDashboardSummaryMock(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("HomePage", () => {
  it("redireciona para /login quando não autenticado", () => {
    useSessionMock.mockReturnValue({ isAuthenticated: false, isLoading: false, user: undefined });
    useDashboardSummaryMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });

    renderWithQueryClient(<HomePage />);

    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("renderiza o AppShell e o dashboard quando autenticado", () => {
    useSessionMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: "1", organizationId: "org-1", email: "admin@acme.test", name: "Admin Demo" },
    });
    useDashboardSummaryMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });

    renderWithQueryClient(<HomePage />);

    expect(screen.getByText("Carregando dashboard...")).toBeInTheDocument();
    expect(screen.getByText("Nexus")).toBeInTheDocument();
  });
});
