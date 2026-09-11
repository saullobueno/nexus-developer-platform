import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RolesTab } from "./roles-tab";

const useRolesMock = vi.fn();
vi.mock("../../hooks/use-roles", () => ({
  useRoles: () => useRolesMock(),
}));

describe("RolesTab", () => {
  it("mostra o estado de loading", () => {
    useRolesMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<RolesTab />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando roles...");
  });

  it("lista as roles com suas permissions", () => {
    useRolesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ id: "r1", name: "Admin", slug: "admin", isSystem: true, permissions: ["services:read", "settings:update"] }],
    });
    render(<RolesTab />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("services:read")).toBeInTheDocument();
    expect(screen.getByText("settings:update")).toBeInTheDocument();
  });
});
