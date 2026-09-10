import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RealtimeToaster } from "./realtime-toaster";

const useRealtimeEventsMock = vi.fn();
vi.mock("../../hooks/use-realtime-events", () => ({
  useRealtimeEvents: () => useRealtimeEventsMock(),
}));

describe("RealtimeToaster", () => {
  it("não renderiza nada quando não há eventos", () => {
    useRealtimeEventsMock.mockReturnValue({ toasts: [], dismiss: vi.fn() });
    const { container } = render(<RealtimeToaster />);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(0);
  });

  it("mostra um toast formatado por evento e permite fechar", async () => {
    const dismiss = vi.fn();
    useRealtimeEventsMock.mockReturnValue({
      toasts: [
        {
          id: "1",
          type: "deployment.completed",
          data: { serviceName: "payments-api", version: "1.4.0" },
        },
      ],
      dismiss,
    });
    const user = userEvent.setup();
    render(<RealtimeToaster />);

    expect(screen.getByText("Deployment concluído")).toBeInTheDocument();
    expect(screen.getByText("payments-api v1.4.0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(dismiss).toHaveBeenCalledWith("1");
  });
});
