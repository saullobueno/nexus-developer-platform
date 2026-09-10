import { apiFetch } from "./api-client";

export interface SessionUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
}

export function getSession(): Promise<{ user: SessionUser }> {
  return apiFetch("/auth/me");
}

export function login(email: string, password: string): Promise<{ user: SessionUser }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return apiFetch("/auth/logout", { method: "POST" });
}
