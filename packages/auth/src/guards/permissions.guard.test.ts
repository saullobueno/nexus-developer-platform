import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser, PermissionsChecker } from "../types";
import { PermissionsGuard } from "./permissions.guard";

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function createReflector(requiredPermissions: string[] | undefined): Reflector {
  return { getAllAndOverride: () => requiredPermissions } as unknown as Reflector;
}

const user: AuthenticatedUser = {
  id: "user-1",
  organizationId: "org-1",
  email: "a@acme.test",
  name: "A",
};

describe("PermissionsGuard", () => {
  it("permite quando não há permissões exigidas", async () => {
    const checker: PermissionsChecker = { getPermissionsForUser: vi.fn() };
    const guard = new PermissionsGuard(createReflector(undefined), checker);

    await expect(guard.canActivate(createContext(user))).resolves.toBe(true);
    expect(checker.getPermissionsForUser).not.toHaveBeenCalled();
  });

  it("nega quando não há usuário autenticado", async () => {
    const checker: PermissionsChecker = { getPermissionsForUser: vi.fn() };
    const guard = new PermissionsGuard(createReflector(["services:read"]), checker);

    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  it("permite quando o usuário tem todas as permissões exigidas", async () => {
    const checker: PermissionsChecker = {
      getPermissionsForUser: vi.fn().mockResolvedValue(["services:read", "services:update"]),
    };
    const guard = new PermissionsGuard(createReflector(["services:read"]), checker);

    await expect(guard.canActivate(createContext(user))).resolves.toBe(true);
  });

  it("nega quando falta alguma permissão exigida", async () => {
    const checker: PermissionsChecker = {
      getPermissionsForUser: vi.fn().mockResolvedValue(["services:read"]),
    };
    const guard = new PermissionsGuard(
      createReflector(["services:read", "services:delete"]),
      checker,
    );

    await expect(guard.canActivate(createContext(user))).rejects.toThrow(ForbiddenException);
  });
});
