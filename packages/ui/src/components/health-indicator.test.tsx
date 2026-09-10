import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthIndicator } from "./health-indicator";

describe("HealthIndicator", () => {
  it("mostra o label correspondente ao status", () => {
    render(<HealthIndicator status="degraded" />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });
});
