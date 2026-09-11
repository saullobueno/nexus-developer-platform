import { describe, expect, it } from "vitest";
import { PERMISSIONS_KEY } from "../constants.js";
import { RequirePermissions } from "./require-permissions.decorator.js";

class Dummy {
  @RequirePermissions("services:read", "services:update")
  method() {
    return undefined;
  }
}

describe("RequirePermissions", () => {
  it("define os metadados de permissões no método decorado", () => {
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, Dummy.prototype.method) as string[];
    expect(metadata).toEqual(["services:read", "services:update"]);
  });
});
