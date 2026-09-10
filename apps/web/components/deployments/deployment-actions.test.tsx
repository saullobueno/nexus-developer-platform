import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeploymentActions } from "./deployment-actions";

const rollbackDeploymentMock = vi.fn();
vi.mock("../../lib/deployments", () => ({
  cancelDeployment: vi.fn(),
  retryDeployment: vi.fn(),
  rollbackDeployment: (...args: unknown[]) => rollbackDeploymentMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("DeploymentActions", () => {
  it("só mostra o botão correspondente ao status atual", () => {
    renderWithQueryClient(
      <DeploymentActions
        deploymentId="d1"
        status="successful"
        serviceName="payments-api"
        version="1.4.0"
      />,
    );

    expect(screen.getByRole("button", { name: "Rollback" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("exige confirmação antes de chamar a mutação de rollback", async () => {
    rollbackDeploymentMock.mockResolvedValue({ id: "d2", status: "successful" });
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeploymentActions
        deploymentId="d1"
        status="successful"
        serviceName="payments-api"
        version="1.4.0"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rollback" }));
    expect(screen.getByRole("heading", { name: "Confirmar rollback" })).toBeVisible();
    expect(rollbackDeploymentMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar rollback" }));
    expect(rollbackDeploymentMock).toHaveBeenCalledWith("d1");
  });
});
