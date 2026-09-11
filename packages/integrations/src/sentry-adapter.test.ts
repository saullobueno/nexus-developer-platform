import { afterEach, describe, expect, it, vi } from "vitest";
import { SentryAdapter } from "./sentry-adapter.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe("SentryAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mapeia projects para ExternalRepository", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([{ id: "1", slug: "payments-api", name: "payments-api", platform: "node" }])),
    );

    const adapter = new SentryAdapter({ token: "t", organizationSlug: "acme" });
    const repositories = await adapter.getRepositories();

    expect(repositories).toEqual([
      {
        id: "payments-api",
        name: "payments-api",
        url: "https://sentry.io/organizations/acme/projects/payments-api/",
        defaultBranch: "main",
        language: "node",
      },
    ]);
  });

  it("mapeia releases do projeto para ExternalDeployment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            version: "1.2.0",
            dateCreated: "2026-01-01T00:00:00Z",
            dateReleased: "2026-01-01T01:00:00Z",
            projects: [{ slug: "payments-api" }],
          },
        ]),
      ),
    );

    const adapter = new SentryAdapter({ token: "t", organizationSlug: "acme" });
    const deployments = await adapter.getDeployments("payments-api");

    expect(deployments).toEqual([
      {
        id: "1.2.0",
        repositoryId: "payments-api",
        environment: "production",
        version: "1.2.0",
        status: "success",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("mapeia issues não resolvidas para ExternalError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([{ id: "9", type: "TimeoutError", title: "Timeout ao chamar provider", count: "42", lastSeen: "2026-01-03T00:00:00Z" }]),
      ),
    );

    const adapter = new SentryAdapter({ token: "t", organizationSlug: "acme" });
    const errors = await adapter.getErrors("payments-api");

    expect(errors).toEqual([
      { id: "9", type: "TimeoutError", message: "Timeout ao chamar provider", occurrences: 42, lastSeenAt: "2026-01-03T00:00:00Z" },
    ]);
  });

  it("getMetrics retorna vazio (fora do escopo da Metrics API do Sentry)", async () => {
    const adapter = new SentryAdapter({ token: "t", organizationSlug: "acme" });
    expect(await adapter.getMetrics()).toEqual([]);
  });
});
