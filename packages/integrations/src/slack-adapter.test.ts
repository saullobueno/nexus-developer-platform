import { afterEach, describe, expect, it, vi } from "vitest";
import { SlackAdapter } from "./slack-adapter.js";

describe("SlackAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("os 4 métodos de IntegrationProvider retornam vazio", async () => {
    const adapter = new SlackAdapter({ token: "t", channel: "#deploys" });
    expect(await adapter.getRepositories()).toEqual([]);
    expect(await adapter.getDeployments()).toEqual([]);
    expect(await adapter.getErrors()).toEqual([]);
    expect(await adapter.getMetrics()).toEqual([]);
  });

  it("sendNotification chama chat.postMessage com o canal e texto configurados", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new SlackAdapter({ token: "t", channel: "#deploys" });
    const result = await adapter.sendNotification("Deploy concluído");

    expect(result).toEqual({ ok: true, error: undefined });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://slack.com/api/chat.postMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ channel: "#deploys", text: "Deploy concluído" }),
      }),
    );
  });

  it("propaga o erro retornado pela Slack Web API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: false, error: "channel_not_found" }) }));

    const adapter = new SlackAdapter({ token: "t", channel: "#invalid" });
    const result = await adapter.sendNotification("oi");

    expect(result).toEqual({ ok: false, error: "channel_not_found" });
  });
});
