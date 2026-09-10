import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it('renderiza o heading "Nexus Developer Platform"', () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Nexus Developer Platform" })).toBeInTheDocument();
  });

  it("renderiza o botão de call-to-action", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: "Explorar catálogo" })).toBeInTheDocument();
  });
});
