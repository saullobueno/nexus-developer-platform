import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

describe("parseEnv", () => {
  it("aceita uma DATABASE_URL válida", () => {
    const result = parseEnv({ DATABASE_URL: "postgresql://user:pass@localhost:5432/db" });
    expect(result.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("rejeita quando DATABASE_URL está ausente", () => {
    expect(() => parseEnv({})).toThrow();
  });

  it("rejeita quando DATABASE_URL não é uma URL válida", () => {
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow();
  });
});
