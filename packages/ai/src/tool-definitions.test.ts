import { describe, expect, it } from "vitest";
import { ALL_TOOL_DEFINITIONS, MUTATING_TOOL_DEFINITIONS, READ_TOOL_DEFINITIONS } from "./tool-definitions";

describe("tool-definitions", () => {
  it("tem 12 ferramentas somente-leitura e 4 mutáveis (spec seção 19)", () => {
    expect(READ_TOOL_DEFINITIONS).toHaveLength(12);
    expect(MUTATING_TOOL_DEFINITIONS).toHaveLength(4);
    expect(ALL_TOOL_DEFINITIONS).toHaveLength(16);
  });

  it("não tem nomes de ferramenta duplicados", () => {
    const names = ALL_TOOL_DEFINITIONS.map((definition) => definition.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("marca isMutating corretamente para cada grupo", () => {
    expect(READ_TOOL_DEFINITIONS.every((definition) => !definition.isMutating)).toBe(true);
    expect(MUTATING_TOOL_DEFINITIONS.every((definition) => definition.isMutating)).toBe(true);
  });

  it("todo tool tem uma description não vazia", () => {
    expect(ALL_TOOL_DEFINITIONS.every((definition) => definition.description.length > 0)).toBe(true);
  });

  it("get_service exige slug", () => {
    const definition = READ_TOOL_DEFINITIONS.find((item) => item.name === "get_service")!;
    expect(definition.inputSchema.safeParse({ slug: "payments-api" }).success).toBe(true);
    expect(definition.inputSchema.safeParse({}).success).toBe(false);
  });

  it("create_incident exige title/summary/severity/serviceIds", () => {
    const definition = MUTATING_TOOL_DEFINITIONS.find((item) => item.name === "create_incident")!;
    expect(
      definition.inputSchema.safeParse({
        title: "t",
        summary: "s",
        severity: "sev2",
        serviceIds: ["id1"],
      }).success,
    ).toBe(true);
    expect(definition.inputSchema.safeParse({ title: "t" }).success).toBe(false);
  });
});
