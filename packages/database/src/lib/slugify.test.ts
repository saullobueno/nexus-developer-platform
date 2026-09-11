import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("converte para minúsculas e troca espaços por hífen", () => {
    expect(slugify("Acme Engineering")).toBe("acme-engineering");
  });

  it("remove acentos", () => {
    expect(slugify("Configuração")).toBe("configuracao");
  });

  it("remove hífens nas pontas", () => {
    expect(slugify("  payments-api!  ")).toBe("payments-api");
  });
});
