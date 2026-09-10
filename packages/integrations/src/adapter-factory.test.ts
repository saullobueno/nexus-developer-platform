import { describe, expect, it } from "vitest";
import { resolveAdapter } from "./adapter-factory";
import { GitHubAdapter } from "./github-adapter";
import { GrafanaAdapter } from "./grafana-adapter";
import { MockAdapter } from "./mock-adapter";
import { SentryAdapter } from "./sentry-adapter";

describe("resolveAdapter", () => {
  it("retorna MockAdapter sempre que demoMode é true, mesmo com config válido", () => {
    const adapter = resolveAdapter({ provider: "github", config: { token: "t", owner: "acme" }, demoMode: true });
    expect(adapter).toBeInstanceOf(MockAdapter);
  });

  it("retorna MockAdapter para github sem config completo", () => {
    const adapter = resolveAdapter({ provider: "github", config: {}, demoMode: false });
    expect(adapter).toBeInstanceOf(MockAdapter);
  });

  it("retorna GitHubAdapter quando token e owner estão presentes", () => {
    const adapter = resolveAdapter({
      provider: "github",
      config: { token: "t", owner: "acme" },
      demoMode: false,
    });
    expect(adapter).toBeInstanceOf(GitHubAdapter);
  });

  it("retorna SentryAdapter quando token e organizationSlug estão presentes", () => {
    const adapter = resolveAdapter({
      provider: "sentry",
      config: { token: "t", organizationSlug: "acme" },
      demoMode: false,
    });
    expect(adapter).toBeInstanceOf(SentryAdapter);
  });

  it("retorna GrafanaAdapter quando baseUrl/apiKey/datasourceUid estão presentes", () => {
    const adapter = resolveAdapter({
      provider: "grafana",
      config: { baseUrl: "https://grafana.test", apiKey: "k", datasourceUid: "uid" },
      demoMode: false,
    });
    expect(adapter).toBeInstanceOf(GrafanaAdapter);
  });

  it("retorna MockAdapter para providers sem adapter dedicado (slack, prometheus)", () => {
    expect(resolveAdapter({ provider: "slack", config: {}, demoMode: false })).toBeInstanceOf(MockAdapter);
    expect(resolveAdapter({ provider: "prometheus", config: {}, demoMode: false })).toBeInstanceOf(MockAdapter);
  });
});
