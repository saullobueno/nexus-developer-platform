import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./settings-page";

vi.mock("../../hooks/use-organization", () => ({
  useOrganization: () => ({ isLoading: true, isError: false, data: undefined }),
}));
vi.mock("../../hooks/use-members", () => ({
  useMembers: () => ({
    isLoading: false,
    isError: false,
    data: [{ id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test", roles: [{ id: "r1", name: "Developer", slug: "developer" }] }],
  }),
}));
vi.mock("../../hooks/use-roles", () => ({
  useRoles: () => ({ isLoading: true, isError: false, data: undefined }),
}));
vi.mock("../../hooks/use-environments", () => ({
  useEnvironments: () => ({ isLoading: true, isError: false, data: undefined }),
}));
vi.mock("../../hooks/use-integrations", () => ({
  useIntegrations: () => ({ isLoading: true, isError: false, data: undefined }),
}));
vi.mock("../../hooks/use-audit-logs", () => ({
  useAuditLogs: () => ({ isLoading: true, isError: false, data: undefined }),
}));
vi.mock("../../lib/settings", () => ({
  updateOrganization: vi.fn(),
  updateMemberRole: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("SettingsPage", () => {
  it("mostra a tab Organization por padrão", () => {
    renderWithQueryClient(<SettingsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando organização...");
  });

  it("troca para a tab Members ao clicar", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: "Members" }));
    expect(screen.getByText("Bruno Alves")).toBeInTheDocument();
  });
});
