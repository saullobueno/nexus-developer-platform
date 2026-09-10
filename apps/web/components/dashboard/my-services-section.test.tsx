import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyServicesSection } from "./my-services-section";

describe("MyServicesSection", () => {
  it("mostra o estado vazio quando não há serviços", () => {
    render(<MyServicesSection services={[]} />);
    expect(
      screen.getByText("Você ainda não é dono nem faz parte do time de nenhum serviço."),
    ).toBeInTheDocument();
  });

  it("lista os serviços informados", () => {
    render(
      <MyServicesSection
        services={[
          { id: "1", name: "payments-api", slug: "payments-api", type: "api", lifecycle: "production" },
        ]}
      />,
    );
    expect(screen.getByText("payments-api")).toBeInTheDocument();
    expect(screen.getByText("api")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
  });
});
