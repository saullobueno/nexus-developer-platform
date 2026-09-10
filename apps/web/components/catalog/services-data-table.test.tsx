import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesDataTable } from "./services-data-table";

describe("ServicesDataTable", () => {
  it("renderiza uma linha por serviço com link para o detalhe", () => {
    render(
      <ServicesDataTable
        data={[
          {
            id: "1",
            name: "payments-api",
            slug: "payments-api",
            type: "api",
            lifecycle: "production",
            language: "TypeScript",
            framework: "NestJS",
            teamName: "Payments",
            health: "healthy",
            version: "1.4.0",
            lastDeployedAt: new Date().toISOString(),
          },
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: "payments-api" });
    expect(link).toHaveAttribute("href", "/catalog/services/payments-api");
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });
});
