import { describe, expect, it } from "vitest";
import { selectModel } from "./model-selection";

describe("selectModel", () => {
  it("retorna null quando nenhuma credencial está presente", () => {
    expect(selectModel({})).toBeNull();
  });

  it("prefere anthropic quando ambas as chaves estão presentes", () => {
    expect(selectModel({ ANTHROPIC_API_KEY: "a", OPENAI_API_KEY: "b" })).toEqual({
      provider: "anthropic",
      modelId: "claude-sonnet-4-5",
    });
  });

  it("usa openai quando só a chave da OpenAI está presente", () => {
    expect(selectModel({ OPENAI_API_KEY: "b" })).toEqual({ provider: "openai", modelId: "gpt-5" });
  });

  it("respeita o override de modelo via env var", () => {
    expect(selectModel({ ANTHROPIC_API_KEY: "a", ANTHROPIC_MODEL: "claude-opus-5" })).toEqual({
      provider: "anthropic",
      modelId: "claude-opus-5",
    });
  });
});
