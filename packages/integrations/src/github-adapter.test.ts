import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubAdapter } from "./github-adapter";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe("GitHubAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mapeia repositórios da API do GitHub para ExternalRepository", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { id: 1, name: "payments-api", html_url: "https://github.com/acme/payments-api", default_branch: "main", language: "TypeScript" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new GitHubAdapter({ token: "t", owner: "acme" });
    const repositories = await adapter.getRepositories();

    expect(repositories).toEqual([
      { id: "1", name: "payments-api", url: "https://github.com/acme/payments-api", defaultBranch: "main", language: "TypeScript" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/orgs/acme/repos?per_page=100",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer t" }) }),
    );
  });

  it("busca o status mais recente de cada deployment", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 10, environment: "production", created_at: "2026-01-01T00:00:00Z", ref: "v1.0.0", statuses_url: "" },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ state: "success" }]));
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new GitHubAdapter({ token: "t", owner: "acme" });
    const deployments = await adapter.getDeployments("payments-api");

    expect(deployments).toEqual([
      {
        id: "10",
        repositoryId: "payments-api",
        environment: "production",
        version: "v1.0.0",
        status: "success",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("mapeia issues com label bug para ExternalError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ id: 5, title: "Crash on login", comments: 3, updated_at: "2026-01-02T00:00:00Z" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new GitHubAdapter({ token: "t", owner: "acme" });
    const errors = await adapter.getErrors("payments-api");

    expect(errors).toEqual([
      { id: "5", type: "bug", message: "Crash on login", occurrences: 3, lastSeenAt: "2026-01-02T00:00:00Z" },
    ]);
  });

  it("lança um erro quando a API responde com status de erro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 401)));
    const adapter = new GitHubAdapter({ token: "invalid", owner: "acme" });
    await expect(adapter.getRepositories()).rejects.toThrow("GitHub API respondeu 401");
  });

  it("getMetrics retorna vazio (GitHub não expõe métricas de runtime)", async () => {
    const adapter = new GitHubAdapter({ token: "t", owner: "acme" });
    expect(await adapter.getMetrics()).toEqual([]);
  });
});
