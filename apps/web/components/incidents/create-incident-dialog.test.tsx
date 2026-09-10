import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateIncidentDialog } from "./create-incident-dialog";

const createIncidentMock = vi.fn();
vi.mock("../../lib/incidents", () => ({
  createIncident: (...args: unknown[]) => createIncidentMock(...args),
}));

const useServicesMock = vi.fn();
vi.mock("../../hooks/use-services", () => ({
  useServices: (...args: unknown[]) => useServicesMock(...args),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CreateIncidentDialog", () => {
  it("exige título e ao menos um serviço selecionado", async () => {
    useServicesMock.mockReturnValue({
      data: { items: [{ id: "s1", name: "payments-api" }], total: 1, page: 1, pageSize: 100 },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<CreateIncidentDialog />);

    await user.click(screen.getByRole("button", { name: "New Incident" }));
    await user.click(screen.getByRole("button", { name: "Criar incidente" }));

    expect(await screen.findByText("Informe um título")).toBeInTheDocument();
    expect(createIncidentMock).not.toHaveBeenCalled();
  });

  it("cria o incidente com os dados informados", async () => {
    useServicesMock.mockReturnValue({
      data: { items: [{ id: "s1", name: "payments-api" }], total: 1, page: 1, pageSize: 100 },
    });
    createIncidentMock.mockResolvedValue({ id: "i1", status: "investigating" });
    const user = userEvent.setup();
    renderWithQueryClient(<CreateIncidentDialog />);

    await user.click(screen.getByRole("button", { name: "New Incident" }));
    await user.type(screen.getByLabelText("Título"), "Erros 5xx em checkout-web");
    await user.click(screen.getByRole("checkbox", { name: "payments-api" }));
    await user.click(screen.getByRole("button", { name: "Criar incidente" }));

    expect(createIncidentMock).toHaveBeenCalledTimes(1);
    expect(createIncidentMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ title: "Erros 5xx em checkout-web", serviceIds: ["s1"] }),
    );
  });
});
