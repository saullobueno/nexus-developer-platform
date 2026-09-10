import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceDependencyGraph } from "./service-dependency-graph";

describe("ServiceDependencyGraph", () => {
  it("mostra a mensagem de vazio quando não há dependências", () => {
    render(<ServiceDependencyGraph service="payments-api" dependencies={[]} />);
    expect(screen.getByText("Nenhuma dependência mapeada.")).toBeInTheDocument();
  });

  it("lista dependências e dependentes", () => {
    render(
      <ServiceDependencyGraph
        service="payments-api"
        dependencies={[{ id: "1", name: "PostgreSQL", isExternal: true }]}
        dependents={[{ id: "2", name: "checkout-web" }]}
      />,
    );
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("checkout-web")).toBeInTheDocument();
    expect(screen.getAllByText("payments-api").length).toBeGreaterThan(0);
  });
});
