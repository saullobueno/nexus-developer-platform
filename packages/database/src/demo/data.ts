import type { BaselineRoleSlug } from "../seed";

export const DEMO_ORGANIZATION_NAME = "Acme Engineering";
export const DEMO_PASSWORD = "demo1234";

export const TEAMS = ["Platform", "Payments", "Identity", "Commerce", "Data", "Mobile"] as const;
export type TeamName = (typeof TEAMS)[number];

export interface DemoServiceDefinition {
  name: string;
  team: TeamName;
  type: "service" | "website" | "library" | "api" | "database" | "worker" | "infrastructure" | "ml_model";
  lifecycle: "experimental" | "development" | "production" | "deprecated";
  language: string;
  framework: string;
  dependsOn?: string[];
  externalDependencies?: string[];
}

export const SERVICES: DemoServiceDefinition[] = [
  {
    name: "payments-api",
    team: "Payments",
    type: "api",
    lifecycle: "production",
    language: "TypeScript",
    framework: "NestJS",
    externalDependencies: ["PostgreSQL", "Stripe"],
  },
  {
    name: "checkout-web",
    team: "Commerce",
    type: "website",
    lifecycle: "production",
    language: "TypeScript",
    framework: "Next.js",
    dependsOn: ["payments-api", "customer-api"],
  },
  {
    name: "identity-api",
    team: "Identity",
    type: "api",
    lifecycle: "production",
    language: "Go",
    framework: "Gin",
    externalDependencies: ["PostgreSQL"],
  },
  {
    name: "customer-api",
    team: "Commerce",
    type: "api",
    lifecycle: "production",
    language: "TypeScript",
    framework: "NestJS",
    dependsOn: ["identity-api"],
    externalDependencies: ["PostgreSQL"],
  },
  {
    name: "orders-service",
    team: "Commerce",
    type: "service",
    lifecycle: "production",
    language: "Java",
    framework: "Spring Boot",
    dependsOn: ["payments-api", "notifications-worker"],
    externalDependencies: ["PostgreSQL"],
  },
  {
    name: "notifications-worker",
    team: "Platform",
    type: "worker",
    lifecycle: "production",
    language: "TypeScript",
    framework: "BullMQ",
    externalDependencies: ["Redis"],
  },
  {
    name: "analytics-api",
    team: "Data",
    type: "api",
    lifecycle: "development",
    language: "Python",
    framework: "FastAPI",
    externalDependencies: ["PostgreSQL"],
  },
  {
    name: "data-pipeline",
    team: "Data",
    type: "worker",
    lifecycle: "production",
    language: "Python",
    framework: "Airflow",
    externalDependencies: ["PostgreSQL"],
  },
];

export interface DemoUserDefinition {
  name: string;
  email: string;
  roleSlug: BaselineRoleSlug;
  team: TeamName | null;
}

export const DEMO_USERS: DemoUserDefinition[] = [
  { name: "Admin Demo", email: "admin@acme.test", roleSlug: "admin", team: "Platform" },
  { name: "Camila Rocha", email: "camila.rocha@acme.test", roleSlug: "tech-lead", team: "Platform" },
  { name: "Bruno Alves", email: "bruno.alves@acme.test", roleSlug: "developer", team: "Payments" },
  { name: "Fernanda Lima", email: "fernanda.lima@acme.test", roleSlug: "developer", team: "Identity" },
  { name: "Rafael Souza", email: "rafael.souza@acme.test", roleSlug: "developer", team: "Commerce" },
  {
    name: "Juliana Prado",
    email: "juliana.prado@acme.test",
    roleSlug: "platform-engineer",
    team: "Data",
  },
  { name: "Marcos Teixeira", email: "marcos.teixeira@acme.test", roleSlug: "developer", team: "Mobile" },
];

export const ENVIRONMENTS = [
  { name: "Production", slug: "production", type: "production" as const },
  { name: "Staging", slug: "staging", type: "staging" as const },
  { name: "QA", slug: "qa", type: "qa" as const },
  { name: "Development", slug: "development", type: "development" as const },
];

export const METRIC_DEFINITIONS = [
  { name: "request_rate", unit: "req/s", base: 150, variance: 40 },
  { name: "p50_latency", unit: "ms", base: 60, variance: 20 },
  { name: "p95_latency", unit: "ms", base: 220, variance: 60 },
  { name: "p99_latency", unit: "ms", base: 420, variance: 120 },
  { name: "error_rate", unit: "%", base: 0.5, variance: 0.4 },
  { name: "cpu_usage", unit: "%", base: 45, variance: 20 },
  { name: "memory_usage", unit: "%", base: 60, variance: 15 },
];

export const DEPLOYMENT_COMMIT_MESSAGES = [
  "fix: corrige timeout na chamada ao provider de pagamento",
  "feat: adiciona suporte a novo método de pagamento",
  "chore: atualiza dependências",
  "fix: corrige race condition no processamento de fila",
  "feat: melhora observabilidade com novos spans",
  "perf: otimiza query de listagem",
  "fix: corrige validação de payload de webhook",
  "refactor: extrai lógica de retry para util compartilhado",
];

export const LOG_MESSAGES: Array<{ level: "debug" | "info" | "warn" | "error"; message: string }> = [
  { level: "info", message: "Request processada com sucesso" },
  { level: "info", message: "Cache miss — buscando do banco" },
  { level: "debug", message: "Payload de entrada validado" },
  { level: "warn", message: "Latência acima do esperado no upstream" },
  { level: "warn", message: "Rate limit próximo do limite configurado" },
  { level: "error", message: "Falha ao conectar no serviço downstream" },
  { level: "error", message: "Timeout ao aguardar resposta do provider externo" },
];

export const INCIDENT_TEMPLATES = [
  {
    title: "Latência elevada em payments-api",
    service: "payments-api",
    severity: "sev2" as const,
    status: "monitoring" as const,
  },
  {
    title: "Erros 5xx intermitentes em checkout-web",
    service: "checkout-web",
    severity: "sev3" as const,
    status: "resolved" as const,
  },
  {
    title: "Fila de notificações acumulando (backlog)",
    service: "notifications-worker",
    severity: "sev3" as const,
    status: "identified" as const,
  },
  {
    title: "Indisponibilidade parcial em identity-api",
    service: "identity-api",
    severity: "sev1" as const,
    status: "resolved" as const,
  },
  {
    title: "Pico de erros em analytics-api após deploy",
    service: "analytics-api",
    severity: "sev3" as const,
    status: "investigating" as const,
  },
];

export const FEATURE_FLAGS = [
  {
    key: "new-checkout-flow",
    name: "Novo fluxo de checkout",
    description: "Habilita o fluxo de checkout redesenhado.",
    type: "percentage" as const,
    enabled: true,
    rules: [{ kind: "percentage", value: { percentage: 45 } }],
  },
  {
    key: "beta-analytics-dashboard",
    name: "Dashboard de analytics (beta)",
    description: "Libera o novo dashboard de analytics para usuários beta.",
    type: "user_targeting" as const,
    enabled: true,
    rules: [{ kind: "segment", value: { segment: "beta" } }],
  },
  {
    key: "enterprise-sso",
    name: "SSO para clientes enterprise",
    description: "Habilita login via SSO para organizações do plano enterprise.",
    type: "org_targeting" as const,
    enabled: true,
    rules: [{ kind: "segment", value: { segment: "enterprise" } }],
  },
  {
    key: "maintenance-banner",
    name: "Banner de manutenção",
    description: "Mostra um banner de aviso de manutenção programada.",
    type: "boolean" as const,
    enabled: false,
    rules: [],
  },
];
