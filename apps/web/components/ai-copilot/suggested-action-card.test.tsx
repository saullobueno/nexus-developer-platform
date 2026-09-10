import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SuggestedActionCard } from "./suggested-action-card";

const approveActionMock = vi.fn();
vi.mock("../../lib/ai-copilot", () => ({
  approveAction: (...args: unknown[]) => approveActionMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("SuggestedActionCard", () => {
  it("mostra o badge Aprovada quando a ação já foi aprovada", () => {
    renderWithQueryClient(
      <SuggestedActionCard
        action={{
          id: "a1",
          toolName: "rollback_deployment",
          input: {},
          output: {},
          isMutating: true,
          approvedAt: new Date().toISOString(),
          createdAt: "",
        }}
      />,
    );
    expect(screen.getByText("Aprovada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  });

  it("chama approveAction ao clicar em Aprovar", async () => {
    approveActionMock.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithQueryClient(
      <SuggestedActionCard
        action={{
          id: "a1",
          toolName: "rollback_deployment",
          input: { deploymentId: "d1" },
          output: null,
          isMutating: true,
          approvedAt: null,
          createdAt: "",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aprovar" }));
    expect(approveActionMock).toHaveBeenCalledWith("a1");
  });
});
