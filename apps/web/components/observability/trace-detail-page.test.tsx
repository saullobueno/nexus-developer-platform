import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TraceDetailPage } from "./trace-detail-page";

const useTraceDetailMock = vi.fn();
vi.mock("../../hooks/use-trace-detail", () => ({
  useTraceDetail: (...args: unknown[]) => useTraceDetailMock(...args),
}));

describe("TraceDetailPage", () => {
  it("mostra o estado de loading", () => {
    useTraceDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    render(<TraceDetailPage id="t1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando trace...");
  });

  it("renderiza o waterfall com os spans", () => {
    useTraceDetailMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        trace: { id: "t1", traceId: "abc123", durationMs: 480, startedAt: new Date().toISOString() },
        spans: [
          {
            id: "s1",
            name: "POST /checkout",
            startedAt: new Date().toISOString(),
            durationMs: 480,
            parentSpanId: null,
            serviceName: "checkout-web",
          },
        ],
      },
    });
    render(<TraceDetailPage id="t1" />);
    expect(screen.getByRole("heading", { name: "abc123" })).toBeInTheDocument();
    expect(screen.getByText(/checkout-web/)).toBeInTheDocument();
  });
});
