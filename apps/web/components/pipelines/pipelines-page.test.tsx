import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PipelinesPage } from "./pipelines-page";

const usePipelinesMock = vi.fn();
vi.mock("../../hooks/use-pipelines", () => ({
  usePipelines: (...args: unknown[]) => usePipelinesMock(...args),
}));

describe("PipelinesPage", () => {
  it("mostra o estado de loading", () => {
    usePipelinesMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<PipelinesPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando pipelines...");
  });

  it("mostra o estado vazio", () => {
    usePipelinesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<PipelinesPage />);
    expect(screen.getByText("Nenhum pipeline encontrado com esses filtros.")).toBeInTheDocument();
  });

  it("lista os pipelines com a última execução", () => {
    usePipelinesMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "p1",
            name: "payments-api-ci",
            serviceName: "payments-api",
            serviceSlug: "payments-api",
            latestRun: { id: "r1", status: "successful", startedAt: new Date().toISOString(), finishedAt: null },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<PipelinesPage />);
    expect(screen.getByRole("link", { name: "payments-api-ci" })).toHaveAttribute("href", "/pipelines/p1");
    expect(screen.getByText("Successful")).toBeInTheDocument();
  });
});
