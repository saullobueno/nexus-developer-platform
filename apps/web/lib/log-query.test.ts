import { describe, expect, it } from "vitest";
import { parseLogQuery } from "./log-query";

describe("parseLogQuery", () => {
  it("extrai level, service e trace da query", () => {
    expect(parseLogQuery("level:error service:payments-api trace:abc123")).toEqual({
      level: "error",
      service: "payments-api",
      traceId: "abc123",
    });
  });

  it("ignora tokens sem chave conhecida ou sem valor", () => {
    expect(parseLogQuery("foo:bar level: service:payments-api")).toEqual({
      service: "payments-api",
    });
  });

  it("retorna objeto vazio para query vazia", () => {
    expect(parseLogQuery("   ")).toEqual({});
  });
});
