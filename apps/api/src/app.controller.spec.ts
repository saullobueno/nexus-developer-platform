import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { AppController } from "./app.controller";

describe("AppController", () => {
  it('retorna { status: "ok" } em getHealth()', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);
    expect(controller.getHealth()).toEqual({ status: "ok" });
  });
});
