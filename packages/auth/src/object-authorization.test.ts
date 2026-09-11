import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { assertSameOrganization } from "./object-authorization.js";

describe("assertSameOrganization", () => {
  it("não lança quando as organizações são iguais", () => {
    expect(() => assertSameOrganization("org-1", "org-1")).not.toThrow();
  });

  it("lança ForbiddenException quando as organizações são diferentes", () => {
    expect(() => assertSameOrganization("org-1", "org-2")).toThrow(ForbiddenException);
  });
});
