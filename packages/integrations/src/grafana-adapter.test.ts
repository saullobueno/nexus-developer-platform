import { afterEach, describe, expect, it, vi } from "vitest";
import { GrafanaAdapter } from "./grafana-adapter.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe("GrafanaAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta o proxy Prometheus e mapeia o resultado para ExternalMetric", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: "success",
        data: { resultType: "vector", result: [{ metric: {}, value: [1735689600, "123.4"] }] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new GrafanaAdapter({
      baseUrl: "https://grafana.acme.test",
      apiKey: "key",
      datasourceUid: "prom-uid",
    });
    const metrics = await adapter.getMetrics("payments-api");

    expect(metrics).toHaveLength(3);
    expect(metrics[0]).toMatchObject({ name: "request_rate", value: 123.4, unit: "req/s" });
    const call = fetchMock.mock.calls[0]!;
    const calledUrl = call[0] as URL;
    expect(calledUrl.toString()).toContain("/api/datasources/proxy/uid/prom-uid/api/v1/query");
    expect(call[1]).toEqual({ headers: { Authorization: "Bearer key" } });
  });

  it("ignora queries sem resultado (série vazia)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: "success", data: { resultType: "vector", result: [] } })),
    );

    const adapter = new GrafanaAdapter({ baseUrl: "https://grafana.acme.test", apiKey: "key", datasourceUid: "uid" });
    expect(await adapter.getMetrics("payments-api")).toEqual([]);
  });

  it("repositories/deployments/errors retornam vazio (Grafana é só observability)", async () => {
    const adapter = new GrafanaAdapter({ baseUrl: "https://grafana.acme.test", apiKey: "key", datasourceUid: "uid" });
    expect(await adapter.getRepositories()).toEqual([]);
    expect(await adapter.getDeployments()).toEqual([]);
    expect(await adapter.getErrors()).toEqual([]);
  });
});
