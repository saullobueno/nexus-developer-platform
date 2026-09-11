import { describe, expect, it } from "vitest";
import { MockAdapter } from "./mock-adapter.js";

describe("MockAdapter", () => {
  const adapter = new MockAdapter();

  it("retorna os repositórios correspondentes aos 8 services da demo", async () => {
    const repositories = await adapter.getRepositories();
    expect(repositories).toHaveLength(8);
    expect(repositories.map((repo) => repo.name)).toContain("payments-api");
  });

  it("retorna 5 deployments para um repositório, todos com o repositoryId correto", async () => {
    const deployments = await adapter.getDeployments("payments-api");
    expect(deployments).toHaveLength(5);
    expect(deployments.every((deployment) => deployment.repositoryId === "payments-api")).toBe(
      true,
    );
  });

  it("é determinístico: o mesmo repositoryId gera os mesmos status/versões", async () => {
    const first = await adapter.getDeployments("checkout-web");
    const second = await adapter.getDeployments("checkout-web");
    expect(first.map((d) => d.status)).toEqual(second.map((d) => d.status));
    expect(first.map((d) => d.version)).toEqual(second.map((d) => d.version));
  });

  it("retorna errors com pelo menos 1 ocorrência", async () => {
    const errors = await adapter.getErrors("identity-api");
    expect(errors.length).toBeGreaterThan(0);
    for (const error of errors) {
      expect(error.occurrences).toBeGreaterThanOrEqual(1);
    }
  });

  it("retorna métricas com valores numéricos plausíveis", async () => {
    const metrics = await adapter.getMetrics("orders-service");
    const requestRate = metrics.find((metric) => metric.name === "request_rate");
    expect(requestRate).toBeDefined();
    expect(requestRate?.value).toBeGreaterThan(0);
  });
});
