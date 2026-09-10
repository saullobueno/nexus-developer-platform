import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TraceWaterfall } from "./trace-waterfall";

describe("TraceWaterfall", () => {
  it("mostra a mensagem de vazio quando não há spans", () => {
    render(<TraceWaterfall spans={[]} />);
    expect(screen.getByText("Nenhum span registrado para este trace.")).toBeInTheDocument();
  });

  it("renderiza uma barra por span", () => {
    const now = new Date().toISOString();
    render(
      <TraceWaterfall
        spans={[
          { id: "1", name: "POST /checkout", serviceName: "checkout-web", startedAt: now, durationMs: 100 },
          { id: "2", name: "call payments-api", serviceName: "payments-api", startedAt: now, durationMs: 60 },
        ]}
      />,
    );
    expect(screen.getByText(/checkout-web/)).toBeInTheDocument();
    expect(screen.getByText(/payments-api/)).toBeInTheDocument();
    expect(screen.getByText("100ms")).toBeInTheDocument();
  });
});
