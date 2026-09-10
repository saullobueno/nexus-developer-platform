import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelineDetailPage } from "./pipeline-detail-page";

const usePipelineDetailMock = vi.fn();
vi.mock("../../hooks/use-pipeline-detail", () => ({
  usePipelineDetail: (...args: unknown[]) => usePipelineDetailMock(...args),
}));

describe("PipelineDetailPage", () => {
  it("mostra o estado de loading", () => {
    usePipelineDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<PipelineDetailPage id="p1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando pipeline...");
  });

  it("lista o histórico de execuções com link para o detalhe", () => {
    usePipelineDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        pipeline: { id: "p1", name: "payments-api-ci", serviceName: "payments-api", serviceSlug: "payments-api" },
        runs: {
          items: [
            {
              id: "r1",
              status: "failed",
              startedAt: new Date().toISOString(),
              finishedAt: null,
              deploymentId: "d1",
              deploymentVersion: "1.2.0",
              triggeredByName: "Admin Demo",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        },
      },
    });
    render(<PipelineDetailPage id="p1" />);

    expect(screen.getByRole("heading", { name: "payments-api-ci" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Failed" });
    expect(link).toHaveAttribute("href", "/pipelines/runs/r1");
    expect(screen.getByText("v1.2.0")).toBeInTheDocument();
  });
});
