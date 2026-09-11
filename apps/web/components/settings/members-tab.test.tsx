import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MembersTab } from "./members-tab";

const useMembersMock = vi.fn();
vi.mock("../../hooks/use-members", () => ({
  useMembers: () => useMembersMock(),
}));

const updateMemberRoleMock = vi.fn();
vi.mock("../../lib/settings", () => ({
  updateMemberRole: (...args: unknown[]) => updateMemberRoleMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("MembersTab", () => {
  it("mostra o estado de loading", () => {
    useMembersMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<MembersTab />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando membros...");
  });

  it("lista os membros e permite trocar a role", async () => {
    useMembersMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ id: "u1", name: "Bruno Alves", email: "bruno.alves@acme.test", roles: [{ id: "r1", name: "Developer", slug: "developer" }] }],
    });
    updateMemberRoleMock.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithQueryClient(<MembersTab />);

    expect(screen.getByText("Bruno Alves")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Role de Bruno Alves"), "tech-lead");
    expect(updateMemberRoleMock).toHaveBeenCalledWith("u1", "tech-lead");
  });
});
