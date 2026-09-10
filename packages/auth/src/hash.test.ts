import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./hash";

describe("hashPassword / verifyPassword", () => {
  it("gera um hash diferente da senha original", async () => {
    const hash = await hashPassword("super-secret-123");
    expect(hash).not.toBe("super-secret-123");
  });

  it("verifica corretamente uma senha válida", async () => {
    const hash = await hashPassword("super-secret-123");
    await expect(verifyPassword("super-secret-123", hash)).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await hashPassword("super-secret-123");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
