import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import { AUTH_COOKIE_NAME } from "../constants";
import type { AuthenticatedUser } from "../types";
import { JwtAuthGuard } from "./jwt-auth.guard";

function createContext(request: Partial<Request>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const user: AuthenticatedUser = {
  id: "user-1",
  organizationId: "org-1",
  email: "a@acme.test",
  name: "A",
};

describe("JwtAuthGuard", () => {
  it("autentica via cookie e popula request.user", async () => {
    const jwtService = { verifyAsync: vi.fn().mockResolvedValue(user) } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const request: Partial<Request> & { user?: AuthenticatedUser } = {
      cookies: { [AUTH_COOKIE_NAME]: "valid-token" },
      headers: {},
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual(user);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
  });

  it("autentica via Authorization: Bearer quando não há cookie", async () => {
    const jwtService = { verifyAsync: vi.fn().mockResolvedValue(user) } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const request: Partial<Request> = {
      cookies: {},
      headers: { authorization: "Bearer header-token" },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("header-token");
  });

  it("lança UnauthorizedException quando não há token", async () => {
    const jwtService = { verifyAsync: vi.fn() } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const request: Partial<Request> = { cookies: {}, headers: {} };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("lança UnauthorizedException quando o token é inválido", async () => {
    const jwtService = {
      verifyAsync: vi.fn().mockRejectedValue(new Error("invalid")),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);
    const request: Partial<Request> = {
      cookies: { [AUTH_COOKIE_NAME]: "bad-token" },
      headers: {},
    };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
