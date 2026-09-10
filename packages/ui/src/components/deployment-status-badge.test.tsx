import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeploymentStatusBadge } from "./deployment-status-badge";

describe("DeploymentStatusBadge", () => {
  it("renderiza Successful com variante success", () => {
    render(<DeploymentStatusBadge status="successful" />);
    expect(screen.getByText("Successful")).toHaveClass("bg-emerald-600");
  });

  it("renderiza Failed com variante destructive", () => {
    render(<DeploymentStatusBadge status="failed" />);
    expect(screen.getByText("Failed")).toHaveClass("bg-destructive");
  });

  it("renderiza Rolled back com variante warning", () => {
    render(<DeploymentStatusBadge status="rolled_back" />);
    expect(screen.getByText("Rolled back")).toHaveClass("bg-amber-500");
  });
});
