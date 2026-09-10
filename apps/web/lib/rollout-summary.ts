import type { FeatureFlagRule } from "./feature-flags";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRule(rule: FeatureFlagRule): string {
  if (rule.kind === "percentage" && typeof rule.value.percentage === "number") {
    return `Everyone ${rule.value.percentage}%`;
  }
  if (rule.kind === "segment" && typeof rule.value.segment === "string") {
    const percentage = typeof rule.value.percentage === "number" ? rule.value.percentage : 100;
    return `${capitalize(rule.value.segment)} ${percentage}%`;
  }
  return `${rule.kind}: ${JSON.stringify(rule.value)}`;
}

export function formatRolloutSummary(rules: FeatureFlagRule[]): string {
  if (rules.length === 0) return "Sem regras de rollout.";
  return rules.map(formatRule).join(" / ");
}
