import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IncidentSeverityBadge } from "./incident-severity-badge";

describe("IncidentSeverityBadge", () => {
  it("renderiza SEV1 com variante destructive", () => {
    render(<IncidentSeverityBadge severity="sev1" />);
    expect(screen.getByText("SEV1")).toHaveClass("bg-destructive");
  });

  it("renderiza SEV4 com variante outline", () => {
    render(<IncidentSeverityBadge severity="sev4" />);
    expect(screen.getByText("SEV4")).toBeInTheDocument();
  });
});
