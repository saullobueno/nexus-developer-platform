import { describe, expect, it } from "vitest";
import { formatRolloutSummary } from "./rollout-summary";
import type { FeatureFlagRule } from "./feature-flags";

function rule(kind: string, value: Record<string, unknown>): FeatureFlagRule {
  return { id: "r", kind, value, order: 0 };
}

describe("formatRolloutSummary", () => {
  it("retorna uma mensagem quando não há regras", () => {
    expect(formatRolloutSummary([])).toBe("Sem regras de rollout.");
  });

  it("formata uma regra de percentage", () => {
    expect(formatRolloutSummary([rule("percentage", { percentage: 45 })])).toBe("Everyone 45%");
  });

  it("formata uma regra de segment com percentage explícito", () => {
    expect(formatRolloutSummary([rule("segment", { segment: "beta", percentage: 100 })])).toBe("Beta 100%");
  });

  it("assume 100% quando a regra de segment não informa percentage", () => {
    expect(formatRolloutSummary([rule("segment", { segment: "enterprise" })])).toBe("Enterprise 100%");
  });

  it("combina múltiplas regras com ' / '", () => {
    const rules = [
      rule("segment", { segment: "enterprise", percentage: 100 }),
      rule("segment", { segment: "beta", percentage: 100 }),
      rule("percentage", { percentage: 45 }),
    ];
    expect(formatRolloutSummary(rules)).toBe("Enterprise 100% / Beta 100% / Everyone 45%");
  });
});
