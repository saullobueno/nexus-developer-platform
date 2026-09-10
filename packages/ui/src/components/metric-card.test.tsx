import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./metric-card";

describe("MetricCard", () => {
  it("renderiza label, valor e unidade", () => {
    render(<MetricCard label="p95 latency" value={220} unit="ms" />);
    expect(screen.getByText("p95 latency")).toBeInTheDocument();
    expect(screen.getByText("220")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
  });
});
