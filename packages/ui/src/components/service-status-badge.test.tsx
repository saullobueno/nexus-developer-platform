import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceStatusBadge } from "./service-status-badge";

describe("ServiceStatusBadge", () => {
  it("renderiza Healthy com variante success", () => {
    render(<ServiceStatusBadge status="healthy" />);
    expect(screen.getByText("Healthy")).toHaveClass("bg-emerald-600");
  });

  it("renderiza Unhealthy com variante destructive", () => {
    render(<ServiceStatusBadge status="unhealthy" />);
    expect(screen.getByText("Unhealthy")).toHaveClass("bg-destructive");
  });
});
