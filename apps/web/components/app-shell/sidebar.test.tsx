import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
}));

describe("Sidebar", () => {
  it("marca o item ativo com aria-current e mantém um nome acessível quando colapsada", () => {
    render(<Sidebar collapsed={false} />);

    const activeLink = screen.getByRole("link", { name: "Catalog" });
    expect(activeLink).toHaveAttribute("aria-current", "page");

    const inactiveLink = screen.getByRole("link", { name: "Home" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });

  it("mantém o nome acessível dos links mesmo quando a sidebar está colapsada", () => {
    render(<Sidebar collapsed={true} />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
  });
});
