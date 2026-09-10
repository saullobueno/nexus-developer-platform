import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricChart } from "./metric-chart";

describe("MetricChart", () => {
  it("renderiza sem lançar erro com uma série de pontos", () => {
    const { container } = render(
      <MetricChart
        title="p95 latency"
        unit="ms"
        data={[
          { timestamp: new Date(Date.now() - 60_000).toISOString(), value: 200 },
          { timestamp: new Date().toISOString(), value: 220 },
        ]}
      />,
    );
    expect(container.querySelector("div")).toBeInTheDocument();
  });
});
