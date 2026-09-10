import { apiFetch } from "./api-client";

export interface FeatureFlagListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  enabled: boolean;
  updatedAt: string;
}

export interface ListFeatureFlagsResult {
  items: FeatureFlagListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListFeatureFlagsParams {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export function listFeatureFlags(params: ListFeatureFlagsParams = {}): Promise<ListFeatureFlagsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/feature-flags${queryString ? `?${queryString}` : ""}`);
}

export interface FeatureFlagRule {
  id: string;
  kind: string;
  value: Record<string, unknown>;
  order: number;
}

export interface FeatureFlagActivityItem {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
}

export interface FeatureFlagDetail {
  flag: FeatureFlagListItem;
  rules: FeatureFlagRule[];
  activity: FeatureFlagActivityItem[];
}

export function getFeatureFlagByKey(key: string): Promise<FeatureFlagDetail> {
  return apiFetch(`/feature-flags/${key}`);
}

export function toggleFeatureFlag(key: string): Promise<FeatureFlagListItem> {
  return apiFetch(`/feature-flags/${key}/toggle`, { method: "PATCH" });
}

export interface UpdateRulesInput {
  rules: Array<{ kind: string; value: Record<string, unknown> }>;
}

export function updateFeatureFlagRules(key: string, input: UpdateRulesInput): Promise<FeatureFlagDetail> {
  return apiFetch(`/feature-flags/${key}/rules`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
