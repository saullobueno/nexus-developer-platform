import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { IntegrationCard } from "./integration-card";

const upsertIntegrationMock = vi.fn();
const testIntegrationMock = vi.fn();
vi.mock("../../lib/integrations", () => ({
  upsertIntegration: (...args: unknown[]) => upsertIntegrationMock(...args),
  testIntegration: (...args: unknown[]) => testIntegrationMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("IntegrationCard", () => {
  it("chama testIntegration e mostra o resultado", async () => {
    testIntegrationMock.mockResolvedValue({ ok: true, usingMock: true, repositoryCount: 8 });
    const user = userEvent.setup();
    renderWithQueryClient(
      <IntegrationCard integration={{ provider: "github", configured: false, enabled: false, config: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: "Testar conexão" }));

    expect(await screen.findByText(/Conexão OK \(dados de demo\)/)).toBeInTheDocument();
    expect(testIntegrationMock).toHaveBeenCalledWith("github");
  });

  it("salva a config informada", async () => {
    upsertIntegrationMock.mockResolvedValue({
      provider: "github",
      configured: true,
      enabled: true,
      config: { owner: "acme" },
    });
    const user = userEvent.setup();
    renderWithQueryClient(
      <IntegrationCard integration={{ provider: "github", configured: false, enabled: false, config: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(upsertIntegrationMock).toHaveBeenCalledWith("github", { config: {}, enabled: false });
  });
});
