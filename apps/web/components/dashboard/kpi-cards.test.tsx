import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCards } from "./kpi-cards";

describe("KpiCards", () => {
  it("renderiza os 6 KPIs com os valores informados", () => {
    render(
      <KpiCards
        kpis={{
          servicesCount: 8,
          deploymentsToday: 3,
          activeIncidents: 2,
          failedDeployments: 1,
          uptimePercentage: 99.5,
          sloCompliance: 98,
        }}
      />,
    );

    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("99.5%")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
  });
});
