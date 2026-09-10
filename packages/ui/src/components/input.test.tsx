import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renderiza com o placeholder informado", () => {
    render(<Input placeholder="email@empresa.com" />);
    expect(screen.getByPlaceholderText("email@empresa.com")).toBeInTheDocument();
  });

  it("aceita texto digitado", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="email" />);
    const input = screen.getByLabelText("email");
    await user.type(input, "admin@acme.test");
    expect(input).toHaveValue("admin@acme.test");
  });

  it("fica desabilitado quando disabled", () => {
    render(<Input disabled aria-label="email" />);
    expect(screen.getByLabelText("email")).toBeDisabled();
  });
});
