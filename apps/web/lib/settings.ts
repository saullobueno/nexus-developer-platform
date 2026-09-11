import { apiFetch } from "./api-client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  timezone: string;
}

export function getOrganization(): Promise<Organization> {
  return apiFetch("/settings/organization");
}

export function updateOrganization(input: { name?: string; timezone?: string; logoUrl?: string | null }): Promise<Organization> {
  return apiFetch("/settings/organization", { method: "PATCH", body: JSON.stringify(input) });
}

export interface Member {
  id: string;
  name: string;
  email: string;
  roles: Array<{ id: string; name: string; slug: string }>;
}

export function listMembers(): Promise<Member[]> {
  return apiFetch("/settings/members");
}

export function updateMemberRole(userId: string, roleSlug: string): Promise<Member> {
  return apiFetch(`/settings/members/${userId}/role`, { method: "PATCH", body: JSON.stringify({ roleSlug }) });
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: string[];
}

export function listRoles(): Promise<RoleWithPermissions[]> {
  return apiFetch("/settings/roles");
}

export interface EnvironmentSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  url: string | null;
}

export function listEnvironments(): Promise<EnvironmentSummary[]> {
  return apiFetch("/settings/environments");
}

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
  actorName: string | null;
}

export interface ListAuditLogsResult {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listAuditLogs(params: { resource?: string; action?: string; page?: number; pageSize?: number } = {}): Promise<ListAuditLogsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/settings/audit-logs${queryString ? `?${queryString}` : ""}`);
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
}

export interface WebhookWithSecret extends Webhook {
  secret: string;
}

export function listWebhooks(): Promise<Webhook[]> {
  return apiFetch("/webhooks");
}

export function createWebhook(input: { url: string; events: string[] }): Promise<WebhookWithSecret> {
  return apiFetch("/webhooks", { method: "POST", body: JSON.stringify(input) });
}

export function deleteWebhook(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/webhooks/${id}`, { method: "DELETE" });
}
