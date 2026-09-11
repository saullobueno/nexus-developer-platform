import { describe, expect, it, vi } from "vitest";
import { runDemoOrchestrator } from "./demo-orchestrator.js";

const KNOWN_SLUGS = ["payments-api", "checkout-web", "identity-api"];

describe("runDemoOrchestrator", () => {
  it("responde 'Why is payments-api slow today?' consultando métricas e deployments", async () => {
    const getMetrics = vi.fn().mockResolvedValue([{ name: "p95_latency", value: 800, unit: "ms" }]);
    const getDeployments = vi.fn().mockResolvedValue({ items: [{ id: "d1", status: "successful" }] });

    const result = await runDemoOrchestrator({
      question: "Why is payments-api slow today?",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_service_metrics: getMetrics, get_service_deployments: getDeployments },
    });

    expect(getMetrics).toHaveBeenCalledWith({ slug: "payments-api" });
    expect(getDeployments).toHaveBeenCalledWith({ slug: "payments-api" });
    expect(result.evidence).toHaveLength(2);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.requiresApproval).toBe(true);
    expect(result.suggestedActions[0]).toMatchObject({ tool: "rollback_deployment", input: { deploymentId: "d1" } });
  });

  it("responde 'Who owns identity-api?' consultando get_service", async () => {
    const getService = vi.fn().mockResolvedValue({ team: { name: "Identity" } });

    const result = await runDemoOrchestrator({
      question: "Who owns identity-api?",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_service: getService },
    });

    expect(getService).toHaveBeenCalledWith({ slug: "identity-api" });
    expect(result.evidence).toHaveLength(1);
  });

  it("responde 'Explain checkout-web architecture' consultando service e dependencies", async () => {
    const getService = vi.fn().mockResolvedValue({ name: "checkout-web" });
    const getDependencies = vi.fn().mockResolvedValue([{ name: "payments-api" }]);

    const result = await runDemoOrchestrator({
      question: "Explain checkout-web architecture",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_service: getService, get_service_dependencies: getDependencies },
    });

    expect(getService).toHaveBeenCalledWith({ slug: "checkout-web" });
    expect(getDependencies).toHaveBeenCalledWith({ slug: "checkout-web" });
    expect(result.evidence).toHaveLength(2);
  });

  it("responde 'What changed before the latest incident?' consultando incidentes recentes sem serviço", async () => {
    const getRelated = vi.fn().mockResolvedValue({ items: [{ id: "i1", title: "Erro 5xx" }] });

    const result = await runDemoOrchestrator({
      question: "What changed before the latest incident?",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_related_incidents: getRelated },
    });

    expect(getRelated).toHaveBeenCalledWith({});
    expect(result.evidence).toHaveLength(1);
  });

  it("busca um incidente específico quando a pergunta contém um UUID", async () => {
    const getIncident = vi.fn().mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", title: "X" });

    const result = await runDemoOrchestrator({
      question: "What is the status of incident 11111111-1111-4111-8111-111111111111?",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_incident: getIncident },
    });

    expect(getIncident).toHaveBeenCalledWith({ id: "11111111-1111-4111-8111-111111111111" });
    expect(result.evidence).toHaveLength(1);
  });

  it("declara honestamente que não há evidência suficiente quando nenhum serviço é reconhecido", async () => {
    const result = await runDemoOrchestrator({
      question: "Show services using PostgreSQL",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: {},
    });

    expect(result.evidence).toHaveLength(0);
    expect(result.confidence).toBe(0);
    expect(result.summary).toMatch(/não consegui identificar/i);
  });

  it("mantém confiança baixa quando a ferramenta correta é chamada mas não retorna dados", async () => {
    const getService = vi.fn().mockResolvedValue(null);

    const result = await runDemoOrchestrator({
      question: "Who owns payments-api?",
      knownServiceSlugs: KNOWN_SLUGS,
      readExecutors: { get_service: getService },
    });

    expect(result.confidence).toBe(0.3);
    expect(result.requiresApproval).toBe(false);
  });
});
