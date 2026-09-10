import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecentDeploymentsSection } from "./recent-deployments-section";

describe("RecentDeploymentsSection", () => {
  it("mostra o estado vazio quando não há deployments", () => {
    render(<RecentDeploymentsSection deployments={[]} />);
    expect(screen.getByText("Nenhum deployment ainda.")).toBeInTheDocument();
  });

  it("lista os deployments informados", () => {
    render(
      <RecentDeploymentsSection
        deployments={[
          {
            id: "1",
            version: "1.2.0",
            status: "successful",
            createdAt: new Date().toISOString(),
            serviceName: "payments-api",
            environmentName: "Production",
            authorName: "Bruno Alves",
          },
        ]}
      />,
    );

    expect(screen.getByText(/payments-api/)).toBeInTheDocument();
    expect(screen.getByText(/v1.2.0/)).toBeInTheDocument();
    expect(screen.getByText("successful")).toBeInTheDocument();
  });
});
