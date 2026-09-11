import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { FlagToggle } from "./flag-toggle";

const toggleFeatureFlagMock = vi.fn();
vi.mock("../../lib/feature-flags", () => ({
  toggleFeatureFlag: (...args: unknown[]) => toggleFeatureFlagMock(...args),
}));

function renderWithQueryClient(ui: ReactElement, queryClient: QueryClient) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("FlagToggle", () => {
  it("aplica a mudança de forma otimista no cache antes da resposta do servidor", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["feature-flags", { page: 1 }], {
      items: [{ key: "new-checkout", enabled: false }],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    let resolveToggle!: () => void;
    toggleFeatureFlagMock.mockReturnValue(
      new Promise((resolve) => {
        resolveToggle = () => resolve({ key: "new-checkout", enabled: true });
      }),
    );

    const user = userEvent.setup();
    renderWithQueryClient(<FlagToggle flagKey="new-checkout" enabled={false} />, queryClient);

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ items: Array<{ key: string; enabled: boolean }> }>([
        "feature-flags",
        { page: 1 },
      ]);
      expect(cached?.items[0]?.enabled).toBe(true);
    });

    resolveToggle();
  });

  it("reverte o cache se a chamada ao servidor falhar", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["feature-flags", { page: 1 }], {
      items: [{ key: "new-checkout", enabled: false }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    toggleFeatureFlagMock.mockRejectedValue(new Error("falhou"));

    const user = userEvent.setup();
    renderWithQueryClient(<FlagToggle flagKey="new-checkout" enabled={false} />, queryClient);

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(screen.getByText("Não foi possível alterar")).toBeInTheDocument();
    });

    const cached = queryClient.getQueryData<{ items: Array<{ key: string; enabled: boolean }> }>([
      "feature-flags",
      { page: 1 },
    ]);
    expect(cached?.items[0]?.enabled).toBe(false);
  });
});
