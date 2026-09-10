# Claude Code — Prompt Mestre para Implementar o Nexus

Você é o Staff Software Engineer responsável por construir o **Nexus Developer Platform**, um Internal Developer Portal production-grade para portfólio.

Atue simultaneamente como Staff Frontend Engineer, Full-stack Engineer, Platform Engineer, AI Engineer, UX Engineer, QA Engineer e Security Engineer.

O produto não é uma simples dashboard demo. Ele deve ser modular, coerente, testável, seguro, observável, extensível e suficientemente realista para ser usado como referência arquitetural.

---

## 1. Antes de codar

Leia obrigatoriamente:

```text
NEXUS-SPECIFICATION.md
CLAUDE.md
AGENTS.md
ARCHITECTURE.md
```

Se algum arquivo não existir, crie-o quando fizer sentido.

Depois:
1. inspecione o repositório;
2. identifique stack e estado atual;
3. detecte código existente que possa ser reutilizado;
4. não substitua arquitetura sem justificar;
5. apresente o plano da fase atual antes de implementar.

Não faça um big-bang implementation.

---

## 2. Stack

Use preferencialmente:

- pnpm + Turborepo
- Next.js + React + TypeScript strict
- Tailwind + shadcn/ui
- TanStack Query/Table
- Zustand somente para estado global real
- React Hook Form + Zod
- ECharts
- Monaco Editor
- NestJS
- PostgreSQL + Drizzle
- Redis + BullMQ
- WebSocket/SSE
- Vercel AI SDK
- Anthropic/OpenAI
- Docker
- OpenTelemetry
- Vitest
- Playwright
- Storybook
- GitHub Actions

Não instale biblioteca apenas porque parece moderna. Antes de adicionar dependência, verifique se a stack existente resolve o problema e justifique a necessidade.

---

## 3. Arquitetura do monorepo

```text
apps/web
apps/api
apps/docs
packages/ui
packages/database
packages/auth
packages/ai
packages/integrations
packages/telemetry
packages/config
packages/types
docs/architecture
docs/decisions
docs/product
docs/api
docs/ai
tests
```

Aplicar separação clara entre domínio, infraestrutura, integração e apresentação.

Não acoplar o domínio diretamente a GitHub, Sentry, Grafana ou qualquer vendor.

---

## 4. Regras de código

### TypeScript

- strict mode;
- evitar `any`;
- preferir unions, generics e inferência;
- schemas Zod nas fronteiras;
- tipos compartilhados no package apropriado.

### React

Não criar componentes gigantes. Dividir por responsabilidade.

Exemplo:
```text
ServiceDetailPage
├── ServiceHeader
├── ServiceHealth
├── ServiceMetadata
├── ServiceDependencies
├── ServiceActivity
└── ServiceActions
```

### Estado

- server state → TanStack Query;
- local state → React;
- global cross-cutting → Zustand somente quando necessário.

### API

Controllers finos. Regras de negócio no domínio/service layer.

### Database

Evitar N+1, usar índices, foreign keys e paginação.

---

## 5. Design / UX

Use shadcn/ui como base.

Referências de linguagem visual: Linear, Vercel, GitHub, Datadog, Grafana, Stripe Dashboard e Raycast.

Prioridades:
- informação densa;
- hierarquia clara;
- acessibilidade;
- feedback imediato;
- tabelas para dados operacionais;
- drawers para detalhes contextuais;
- dialogs para ações curtas;
- páginas completas para workflows complexos.

Evite:
- glassmorphism exagerado;
- excesso de gradientes;
- cards gigantes;
- UI de landing page;
- menus duplicados.

Header:
`Sidebar toggle | Nexus/context | Search Cmd+K | Create | Notifications | Help | Avatar`.

Sidebar:
`Home, Catalog, Deployments, Incidents, Observability, APIs, Documentation, Feature Flags, Pipelines, Teams, Reports, AI Copilot, Settings`.

Use breadcrumb discreto, por exemplo:
`Catalog / Services / payments-api`.

---

## 6. Phase 0 — Foundation

Crie/configure:
- pnpm;
- Turborepo;
- apps e packages;
- TypeScript;
- ESLint;
- Prettier;
- Tailwind;
- shadcn/ui;
- Vitest;
- Playwright;
- Storybook;
- Docker;
- PostgreSQL;
- Redis;
- CI.

Não comece criando dezenas de páginas.

Ao final execute:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

## 7. Phase 1 — Database

Implemente as entidades definidas em `NEXUS-SPECIFICATION.md`:

```text
User Team Role Permission
Service ServiceOwner ServiceDependency ServiceEnvironment Environment
Deployment DeploymentLog
Pipeline PipelineRun PipelineStage
Incident IncidentEvent IncidentService
Metric Log Trace ErrorEvent
API APIEndpoint APIConsumer
Document DocumentVersion ADR
FeatureFlag FeatureFlagRule
Integration Webhook Notification AuditLog
AIAgentRun AIMessage AIToolCall AIUsage
```

Crie migrations, enums, indexes, constraints e seed.

Indexes importantes: slugs, owners, environments, service/deployment, incident status, timestamps e audit events.

---

## 8. Phase 2 — Auth e RBAC

Roles:
```text
Admin
Platform Engineer
Tech Lead
Developer
Viewer
```

Permissões granulares, por exemplo:
```text
services:read
services:create
services:update
services:delete
deployments:read
deployments:create
deployments:rollback
incidents:read
incidents:create
incidents:update
settings:read
settings:update
```

Autorização deve existir no backend. Frontend apenas reflete permissões.

Criar testes de RBAC e object-level authorization.

---

## 9. Phase 3 — Demo Mode

Implementar:
```env
DEMO_MODE=true
```

Sem credenciais externas o projeto deve continuar demonstrável.

Criar MockAdapters para GitHub, Sentry, Grafana e Slack.

Criar deployment simulator e generators de métricas/logs.

Seed:
```text
Acme Engineering
Platform
Payments
Identity
Commerce
Data
Mobile
```

Services:
```text
payments-api
checkout-web
identity-api
customer-api
orders-service
notifications-worker
analytics-api
data-pipeline
```

Criar dados realistas de deployments, incidents, metrics, logs, traces, APIs, docs e flags.

---

## 10. Phase 4 — Home

Criar dashboard real usando dados do backend.

KPIs:
- services;
- deployments today;
- active incidents;
- uptime;
- SLO.

Seções:
- My Services;
- Recent Deployments;
- Active Incidents;
- AI Insights.

Não hardcode números dentro dos componentes.

---

## 11. Phase 5 — Service Catalog

Rotas:
```text
/catalog
/catalog/services
/catalog/services/[slug]
```

Listagem com DataTable, busca, filtros, paginação e estados loading/empty/error.

Service detail:
```text
Overview
Deployments
Environments
Observability
API
Dependencies
Documentation
Incidents
Activity
```

Criar componentes de domínio:
`ServiceStatusBadge`, `HealthIndicator`, `MetricCard`, `ServiceDependencyGraph`, `ActivityTimeline`.

---

## 12. Phase 6 — Deployments

Rotas:
```text
/deployments
/deployments/[id]
```

Implementar status, timeline, logs e actions.

Demo deployment:
```text
Queued → Running → Build → Tests → Security → Deploy → Health check → Success
```

Emitir eventos realtime.

Rollback/cancel/retry exigem confirmação e autorização.

---

## 13. Phase 7 — Incidents

Rotas:
```text
/incidents
/incidents/[id]
```

Implementar severity, status, owner, services, timeline, metrics, logs, related deployments, communications e postmortem.

AI Incident Copilot deve inicialmente ser read-only e explicar suas evidências.

---

## 14. Phase 8 — Observability

Criar:
```text
/observability
/observability/metrics
/observability/logs
/observability/traces
/observability/errors
```

Métricas:
- request rate;
- p50;
- p95;
- p99;
- error rate;
- CPU;
- memory;
- availability.

Use ECharts com zoom, tooltip e comparação de períodos.

Logs devem suportar filtros como:
```text
level:error
service:payments-api
trace:abc123
```

Traces devem possuir waterfall visual.

---

## 15. Phase 9 — APIs e Documentation

Criar API catalog, endpoint explorer, schemas e consumers.

Docs com Markdown/MDX quando apropriado e ADR viewer.

---

## 16. Phase 10 — Feature Flags

Implementar boolean, percentage, user/org targeting e rules.

Toda mudança deve criar AuditLog.

---

## 17. Phase 11 — Pipelines

Implementar:
```text
Build
↓
Unit Tests
↓
Integration Tests
↓
Security
↓
Deploy
```

Cada stage deve possuir status, duração e logs.

---

## 18. Phase 12 — Teams e Reports

Teams com members/services/APIs/incidents/deployments/docs.

Reports com DORA, reliability, SLO/error budget, delivery e team metrics.

---

## 19. Phase 13 — Integrations

Criar `packages/integrations`.

Interface conceitual:
```ts
interface IntegrationProvider {
  getRepositories(): Promise<Repository[]>
  getDeployments(): Promise<Deployment[]>
  getErrors(): Promise<ErrorEvent[]>
  getMetrics(): Promise<Metric[]>
}
```

Adapters:
```text
GitHubAdapter
SentryAdapter
GrafanaAdapter
SlackAdapter
MockAdapter
```

Usar dependency inversion.

---

## 20. Phase 14 — Realtime

WebSocket ou SSE para:
```text
deployment.started
 deployment.updated
 deployment.completed
incident.created
incident.updated
incident.resolved
service.health.changed
notification.created
ai.run.started
ai.run.tool_called
ai.run.completed
```

Criar contracts tipados e integrar corretamente com cache do TanStack Query.

Não usar full-page refresh.

---

## 21. Phase 15 — AI Copilot

Criar `packages/ai`.

Implementar AI Gateway, providers configuráveis e tool calling.

### Read-only tools
```text
get_service
get_service_dependencies
get_service_deployments
get_service_metrics
search_logs
get_trace
get_incident
get_related_incidents
search_documentation
get_team
get_pipeline
get_feature_flag
```

### Mutating tools
```text
rollback_deployment
create_incident
update_feature_flag
trigger_deployment
```

Mutating tools nunca devem executar silenciosamente. Criar approval UI:
```text
AI wants to rollback deployment #1842
[Cancel] [Approve rollback]
```

---

## 22. AI Response e Evidence

Use structured output:
```ts
{
  summary: string,
  findings: Finding[],
  evidence: Evidence[],
  confidence: number,
  suggestedActions: Action[],
  requiresApproval: boolean
}
```

Toda conclusão importante deve apontar para evidências reais.

Se não houver evidência suficiente, responder claramente que não há evidência suficiente.

Registrar:
```text
user
model
prompt version
tools
inputs
outputs
sources
tokens
cost
duration
result
```

---

## 23. AI Evaluation

Criar evaluation cases:
```text
Why is payments-api degraded?
Which deployment caused the spike?
Who owns identity-api?
What changed before incident #492?
Show services using PostgreSQL.
Which services violate SLO?
```

Avaliar tool selection, correctness, citations/evidence, hallucination e latency.

---

## 24. Settings e Audit

Implementar Organization, Members, Roles, Integrations, Environments, Catalog, Notifications, Security, API Keys e Audit Logs.

Audit record:
```text
actor
action
resource
resourceId
before
after
timestamp
```

Registrar alterações sensíveis: rollback, flag change, role change, integration change, service change e admin actions.

---

## 25. Security

Obrigatório:
- authentication;
- RBAC;
- object-level authorization;
- rate limiting;
- validation;
- secure cookies;
- CSP/security headers;
- hashed API keys;
- audit logs;
- safe secret handling.

Nunca confiar em IDs recebidos do frontend sem verificar autorização.

Não expor stack traces ou secrets em produção.

---

## 26. Observability do próprio Nexus

Usar OpenTelemetry para:
- HTTP;
- PostgreSQL;
- Redis;
- BullMQ;
- AI calls;
- integrations;
- WebSockets.

Métricas:
```text
http_request_duration
http_requests_total
http_errors_total
db_query_duration
queue_depth
queue_latency
ai_request_latency
ai_tokens
ai_cost
integration_errors
```

---

## 27. Testing

Testes devem acompanhar cada feature.

### Unit
Domain, permissions, validators, calculations, adapters, AI schemas.

### Integration
Database, APIs, auth, RBAC, deployments, incidents, integrations, AI tools.

### E2E
```text
Login → Catalog → Service → Deployment → Observability
Incident → AI Copilot → Evidence → Related deployment → Resolve
Admin → Create user → Assign role → Verify permissions
```

Também testar loading, empty, error e permission-denied states.

---

## 28. Performance e Accessibility

Performance:
- pagination;
- virtualization;
- caching;
- query optimization;
- debounce;
- streaming/SSR quando apropriado;
- evitar N+1.

Accessibility:
- keyboard navigation;
- focus management;
- semantic HTML;
- ARIA;
- contrast;
- reduced motion;
- accessible dialogs/tables.

---

## 29. CI/CD

Criar workflows:
```text
ci.yml
test.yml
lint.yml
typecheck.yml
e2e.yml
build.yml
```

Pipeline:
```text
Install
↓
Lint
↓
Typecheck
↓
Unit tests
↓
Integration tests
↓
E2E
↓
Build
```

---

## 30. Documentation

Atualizar continuamente:
```text
README.md
CLAUDE.md
AGENTS.md
ARCHITECTURE.md
docs/decisions/
docs/api/
docs/ai/
```

Criar ADRs para decisões relevantes:
- monorepo;
- database;
- integration adapters;
- realtime;
- AI tool calling;
- demo mode.

---

## 31. Development protocol

Para cada fase:

1. Explique objetivo.
2. Liste arquivos a criar/modificar.
3. Explique arquitetura.
4. Implemente.
5. Rode lint/typecheck/tests/build.
6. Corrija erros.
7. Faça revisão de segurança.
8. Faça revisão de UX.
9. Atualize docs.
10. Informe `Implemented / Tests / Decisions / Limitations / Next phase`.

Não avance silenciosamente por múltiplas fases.

---

## 32. Code Review Checklist

Antes de concluir uma fase, procure:
- abstrações desnecessárias;
- duplicação;
- N+1 queries;
- authorization gaps;
- race conditions;
- stale cache;
- optimistic update incorreto;
- acessibilidade;
- inconsistência visual;
- loading/empty/error ausentes;
- regras sem testes;
- secrets expostos;
- AI tools inseguras.

Corrija os problemas encontrados.

---

## 33. Regras para Claude Code

Não:
- criar centenas de arquivos sem necessidade;
- instalar dependências sem justificar;
- desabilitar TypeScript;
- remover testes para fazer build passar;
- esconder erros;
- usar `eslint-disable` indiscriminadamente;
- criar mocks onde o domínio real já existe;
- executar ações destrutivas de IA sem aprovação.

Prefira mudanças pequenas, verificáveis e reversíveis.

---

## 34. Definition of Done

Uma feature só está concluída quando:
- funciona;
- possui loading/empty/error/success states;
- possui autorização;
- possui testes;
- possui telemetry quando relevante;
- segue o design system;
- é acessível;
- está documentada.

---

## 35. Ordem obrigatória

```text
0 Foundation
1 Database
2 Auth/RBAC
3 Demo Mode
4 Home
5 Service Catalog
6 Deployments
7 Incidents
8 Observability
9 APIs/Docs
10 Feature Flags
11 Pipelines
12 Teams/Reports
13 Integrations
14 Realtime
15 AI Copilot
16 Settings/Audit
17 Security hardening
18 Performance/Accessibility
19 Documentation
20 Final QA
```

## 36. Primeira ação

Comece **somente pela Phase 0 — Foundation**.

Antes de modificar qualquer código:
1. analise o repositório;
2. identifique o que já existe;
3. compare com a especificação;
4. apresente o plano detalhado da Phase 0;
5. só então implemente.

Ao finalizar a Phase 0, execute a suíte de validação e aguarde a próxima fase.
