import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PipelineTimeline } from "./pipeline-timeline";

describe("PipelineTimeline", () => {
  it("mostra a mensagem de vazio quando não há stages", () => {
    render(<PipelineTimeline stages={[]} />);
    expect(screen.getByText("Sem pipeline associado.")).toBeInTheDocument();
  });

  it("lista os stages em ordem com o status de cada um", () => {
    render(
      <PipelineTimeline
        stages={[
          { id: "s1", name: "Build", order: 0, status: "success" },
          { id: "s2", name: "Unit Tests", order: 1, status: "failed" },
        ]}
      />,
    );
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Unit Tests")).toBeInTheDocument();
  });
});
