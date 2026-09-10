import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./toast";

describe("Toast", () => {
  it("mostra título e descrição", () => {
    render(<Toast title="Deployment concluído" description="payments-api v1.4.0" />);
    expect(screen.getByText("Deployment concluído")).toBeInTheDocument();
    expect(screen.getByText("payments-api v1.4.0")).toBeInTheDocument();
  });

  it("chama onDismiss ao clicar em fechar", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Toast title="Novo incidente" onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
