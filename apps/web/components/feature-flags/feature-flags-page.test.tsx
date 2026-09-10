import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { FeatureFlagsPage } from "./feature-flags-page";

const useFeatureFlagsMock = vi.fn();
vi.mock("../../hooks/use-feature-flags", () => ({
  useFeatureFlags: (...args: unknown[]) => useFeatureFlagsMock(...args),
}));

vi.mock("../../lib/feature-flags", () => ({
  toggleFeatureFlag: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("FeatureFlagsPage", () => {
  it("mostra o estado de loading", () => {
    useFeatureFlagsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<FeatureFlagsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando feature flags...");
  });

  it("mostra o estado vazio", () => {
    useFeatureFlagsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    renderWithQueryClient(<FeatureFlagsPage />);
    expect(screen.getByText("Nenhuma feature flag encontrada com esses filtros.")).toBeInTheDocument();
  });

  it("lista as flags quando a busca tem sucesso", () => {
    useFeatureFlagsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "f1",
            key: "new-checkout-flow",
            name: "Novo fluxo de checkout",
            description: null,
            type: "percentage",
            enabled: true,
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    renderWithQueryClient(<FeatureFlagsPage />);
    expect(screen.getByRole("link", { name: "Novo fluxo de checkout" })).toHaveAttribute(
      "href",
      "/feature-flags/new-checkout-flow",
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
