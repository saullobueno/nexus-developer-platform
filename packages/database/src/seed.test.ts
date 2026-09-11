import { describe, expect, it } from "vitest";
import { BASELINE_PERMISSIONS, BASELINE_ROLES, ROLE_PERMISSION_MAP } from "./seed.js";

describe("ROLE_PERMISSION_MAP", () => {
  it("tem uma entrada para cada role baseline", () => {
    for (const role of BASELINE_ROLES) {
      expect(ROLE_PERMISSION_MAP[role.slug]).toBeDefined();
    }
  });

  it("só referencia permissions que existem em BASELINE_PERMISSIONS", () => {
    const validKeys = new Set<string>(BASELINE_PERMISSIONS);
    for (const permissionKeys of Object.values(ROLE_PERMISSION_MAP)) {
      for (const key of permissionKeys) {
        expect(validKeys.has(key)).toBe(true);
      }
    }
  });

  it("admin tem todas as permissions baseline", () => {
    expect(ROLE_PERMISSION_MAP.admin).toHaveLength(BASELINE_PERMISSIONS.length);
  });
});
