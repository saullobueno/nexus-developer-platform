import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentsTab } from "./environments-tab";

const useEnvironmentsMock = vi.fn();
vi.mock("../../hooks/use-environments", () => ({
  useEnvironments: () => useEnvironmentsMock(),
}));

describe("EnvironmentsTab", () => {
  it("mostra o estado vazio", () => {
    useEnvironmentsMock.mockReturnValue({ isLoading: false, isError: false, data: [] });
    render(<EnvironmentsTab />);
    expect(screen.getByText("Nenhum environment cadastrado.")).toBeInTheDocument();
  });

  it("lista os environments com o type em badge", () => {
    useEnvironmentsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ id: "e1", name: "Production", slug: "production", type: "production", url: "https://acme.test" }],
    });
    render(<EnvironmentsTab />);

    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(screen.getByText("https://acme.test")).toBeInTheDocument();
  });
});
