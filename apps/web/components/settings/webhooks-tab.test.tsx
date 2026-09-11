import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { WebhooksTab } from "./webhooks-tab";

const useWebhooksMock = vi.fn();
vi.mock("../../hooks/use-webhooks", () => ({
  useWebhooks: (...args: unknown[]) => useWebhooksMock(...args),
}));

const createWebhookMock = vi.fn();
const deleteWebhookMock = vi.fn();
vi.mock("../../lib/settings", () => ({
  createWebhook: (...args: unknown[]) => createWebhookMock(...args),
  deleteWebhook: (...args: unknown[]) => deleteWebhookMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("WebhooksTab", () => {
  it("mostra o estado de loading", () => {
    useWebhooksMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<WebhooksTab />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando webhooks...");
  });

  it("lista os webhooks cadastrados com seus events", () => {
    useWebhooksMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ id: "w1", url: "https://status.example.com/hooks/nexus", events: ["deployment.completed"], createdAt: new Date().toISOString() }],
    });
    renderWithQueryClient(<WebhooksTab />);

    expect(screen.getByText("https://status.example.com/hooks/nexus")).toBeInTheDocument();
    expect(screen.getByText("deployment.completed")).toBeInTheDocument();
  });

  it("cria um webhook e exibe o segredo em texto puro apenas uma vez", async () => {
    useWebhooksMock.mockReturnValue({ isLoading: false, isError: false, data: [] });
    createWebhookMock.mockResolvedValue({
      id: "w2",
      url: "https://example.com/hook",
      events: ["incident.created"],
      createdAt: new Date().toISOString(),
      secret: "plain-text-secret-shown-once",
    });

    const user = userEvent.setup();
    renderWithQueryClient(<WebhooksTab />);

    await user.type(screen.getByLabelText("URL"), "https://example.com/hook");
    await user.type(screen.getByLabelText("Events (separados por vírgula)"), "incident.created");
    await user.click(screen.getByRole("button", { name: "Criar webhook" }));

    expect(await screen.findByText("plain-text-secret-shown-once")).toBeInTheDocument();
    expect(createWebhookMock).toHaveBeenCalledWith({ url: "https://example.com/hook", events: ["incident.created"] });
  });
});
