import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { IntegrationsTab } from "./integrations-tab";

const useIntegrationsMock = vi.fn();
vi.mock("../../hooks/use-integrations", () => ({
  useIntegrations: (...args: unknown[]) => useIntegrationsMock(...args),
}));

vi.mock("../../lib/integrations", () => ({
  upsertIntegration: vi.fn(),
  testIntegration: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("IntegrationsTab", () => {
  it("mostra o estado de loading", () => {
    useIntegrationsMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<IntegrationsTab />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando integrations...");
  });

  it("lista as integrations com status configurado/não configurado", () => {
    useIntegrationsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        { provider: "github", configured: true, enabled: true, config: { owner: "acme" } },
        { provider: "slack", configured: false, enabled: false, config: {} },
      ],
    });
    renderWithQueryClient(<IntegrationsTab />);

    expect(screen.getByRole("heading", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Slack" })).toBeInTheDocument();
    expect(screen.getByText("Configurado")).toBeInTheDocument();
    expect(screen.getByText("Não configurado")).toBeInTheDocument();
  });
});
