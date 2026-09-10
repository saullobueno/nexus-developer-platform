import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActiveIncidentsSection } from "./active-incidents-section";

describe("ActiveIncidentsSection", () => {
  it("mostra uma mensagem positiva quando não há incidentes ativos", () => {
    render(<ActiveIncidentsSection incidents={[]} />);
    expect(screen.getByText("Nenhum incidente ativo — tudo tranquilo.")).toBeInTheDocument();
  });

  it("lista os incidentes ativos informados", () => {
    render(
      <ActiveIncidentsSection
        incidents={[
          {
            id: "1",
            title: "Latência elevada em payments-api",
            severity: "sev2",
            status: "monitoring",
            detectedAt: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByText("Latência elevada em payments-api")).toBeInTheDocument();
    expect(screen.getByText("SEV2")).toBeInTheDocument();
  });
});
