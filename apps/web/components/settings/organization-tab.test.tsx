import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationTab } from "./organization-tab";

const useOrganizationMock = vi.fn();
vi.mock("../../hooks/use-organization", () => ({
  useOrganization: () => useOrganizationMock(),
}));

const updateOrganizationMock = vi.fn();
vi.mock("../../lib/settings", () => ({
  updateOrganization: (...args: unknown[]) => updateOrganizationMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("OrganizationTab", () => {
  it("mostra o estado de loading", () => {
    useOrganizationMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<OrganizationTab />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando organização...");
  });

  it("preenche o formulário com os dados atuais e salva", async () => {
    useOrganizationMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: "o1", name: "Acme Engineering", slug: "acme-engineering", logoUrl: null, timezone: "UTC" },
    });
    updateOrganizationMock.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithQueryClient(<OrganizationTab />);

    expect(screen.getByLabelText("Name")).toHaveValue("Acme Engineering");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(updateOrganizationMock).toHaveBeenCalledWith({ name: "Acme Engineering", timezone: "UTC" });
  });
});
