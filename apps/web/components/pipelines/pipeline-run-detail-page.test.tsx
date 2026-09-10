import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineRunDetailPage } from "./pipeline-run-detail-page";

const usePipelineRunDetailMock = vi.fn();
vi.mock("../../hooks/use-pipeline-run-detail", () => ({
  usePipelineRunDetail: (...args: unknown[]) => usePipelineRunDetailMock(...args),
}));

describe("PipelineRunDetailPage", () => {
  it("mostra o estado de loading", () => {
    usePipelineRunDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<PipelineRunDetailPage runId="r1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando execução...");
  });

  it("renderiza o timeline e os stages com logs", () => {
    usePipelineRunDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        run: {
          id: "r1",
          status: "failed",
          startedAt: new Date().toISOString(),
          finishedAt: null,
          deploymentId: "d1",
          deploymentVersion: "1.2.0",
          triggeredByName: "Admin Demo",
          pipelineId: "p1",
          pipelineName: "payments-api-ci",
          serviceName: "payments-api",
          serviceSlug: "payments-api",
        },
        stages: [
          {
            id: "s1",
            name: "Build",
            order: 0,
            status: "success",
            startedAt: null,
            finishedAt: null,
            durationMs: 12000,
            logs: "$ run build\n✓ Build passed",
          },
          {
            id: "s2",
            name: "Unit Tests",
            order: 1,
            status: "failed",
            startedAt: null,
            finishedAt: null,
            durationMs: 8000,
            logs: "$ run unit-tests\n✗ Unit Tests failed",
          },
        ],
      },
    });
    render(<PipelineRunDetailPage runId="r1" />);

    expect(screen.getByRole("heading", { name: "payments-api" })).toBeInTheDocument();
    expect(screen.getByText("v1.2.0", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Unit Tests failed/)).toBeInTheDocument();
  });
});
