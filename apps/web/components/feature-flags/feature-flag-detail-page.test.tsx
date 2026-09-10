import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { FeatureFlagDetailPage } from "./feature-flag-detail-page";

const useFeatureFlagDetailMock = vi.fn();
vi.mock("../../hooks/use-feature-flag-detail", () => ({
  useFeatureFlagDetail: (...args: unknown[]) => useFeatureFlagDetailMock(...args),
}));

vi.mock("../../lib/feature-flags", () => ({
  toggleFeatureFlag: vi.fn(),
  updateFeatureFlagRules: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const detail = {
  flag: {
    id: "f1",
    key: "advanced-search",
    name: "Busca avançada",
    description: "Libera filtros avançados.",
    type: "rule_based",
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
  rules: [
    { id: "r1", kind: "segment", value: { segment: "enterprise", percentage: 100 }, order: 0 },
    { id: "r2", kind: "percentage", value: { percentage: 45 }, order: 1 },
  ],
  activity: [{ id: "a1", action: "feature_flag.enable", createdAt: new Date().toISOString(), actorName: "Admin Demo" }],
};

describe("FeatureFlagDetailPage", () => {
  it("mostra o estado de loading", () => {
    useFeatureFlagDetailMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderWithQueryClient(<FeatureFlagDetailPage flagKey="advanced-search" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando feature flag...");
  });

  it("mostra o rollout summary, as regras e a activity", () => {
    useFeatureFlagDetailMock.mockReturnValue({ isLoading: false, isError: false, data: detail });
    renderWithQueryClient(<FeatureFlagDetailPage flagKey="advanced-search" />);

    expect(screen.getByRole("heading", { name: "Busca avançada" })).toBeInTheDocument();
    expect(screen.getByText("Enterprise 100% / Everyone 45%")).toBeInTheDocument();
    expect(screen.getByText("feature_flag.enable")).toBeInTheDocument();
  });
});
