# Architecture

Visão arquitetural de alto nível do Nexus. Para o detalhamento de produto/features, ver `NEXUS-SPECIFICATION.md`. Para decisões pontuais justificadas, ver `docs/decisions/` (ADRs).

## Visão geral (C4 — nível de contexto)

```text
                         ┌────────────────────┐
                         │   Usuário (browser) │
                         └──────────┬──────────┘
                                    │ HTTPS
                          ┌─────────▼─────────┐
                          │   apps/web (Next)  │  UI client-side (AuthGuard + TanStack Query)
                          └─────────┬─────────┘
                                    │ REST + SSE
                          ┌─────────▼─────────┐
                          │   apps/api (Nest)  │  domínio, RBAC, realtime event bus, AI gateway
                          └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   PostgreSQL       │
                          │  (via Drizzle)     │
                          └────────────────────┘
                                    │
                     ┌──────────────┴───────────────┐
                     │   packages/integrations       │  adapters (GitHub/Sentry/Grafana/Slack)
                     │   packages/ai                 │  providers (Anthropic/OpenAI) + tools
                     └────────────────────────────────┘
```

Sem Redis/BullMQ/WebSocket: nenhuma fase criou uma necessidade real de fila/job em background, e o realtime (Phase 14) é resolvido inteiramente em-processo (RxJS `Subject` + SSE nativo do NestJS/browser) — ver ADR `0013-sse-instead-of-websocket.md`. Adicionar essas peças sem um caso de uso concreto violaria a regra do projeto de não instalar dependência sem justificar.

## Camadas e separação de responsabilidades

- **Apresentação** (`apps/web`): só UI e orquestração de dados via TanStack Query. Não contém regra de negócio nem decide autorização — apenas reflete o que o backend permite.
- **Domínio/serviço** (`apps/api/src/**/*.service.ts`, por módulo de feature): regra de negócio, validação, autorização real. Controllers ficam finos — só roteiam requests e delegam ao domínio.
- **Infraestrutura** (`packages/database`, `packages/telemetry`): acesso a Postgres/Redis e instrumentação, sem conhecimento de regra de negócio.
- **Integração** (`packages/integrations`): todo acesso a sistemas externos (GitHub, Sentry, Grafana, Slack) passa por uma interface `IntegrationProvider`, nunca é chamado diretamente do domínio. Isso permite trocar um provider real por `MockAdapter` (Demo Mode) sem tocar em regra de negócio.
- **AI** (`packages/ai`): Gateway de IA com tool calling. Tools de leitura (`get_service`, `search_logs`, etc.) e tools mutáveis (`rollback_deployment`, `trigger_deployment`, etc.) — mutáveis sempre exigem aprovação humana explícita antes de executar.

## Monorepo

pnpm workspaces + Turborepo. Ver ADR `0001-monorepo-tooling.md` para a justificativa e para a regra de quais pacotes têm passo de build (`tsc`) vs. quais são source-only (consumidos diretamente por bundlers).

## Realtime

Server-Sent Events (`GET /realtime/events`, `@Sse()` do NestJS) emitidos por `apps/api` a partir de um `RealtimeEventBusService` in-process (RxJS `Subject`) para eventos tipados: `deployment.started/updated/completed`, `incident.created/updated/resolved`, `ai.run.started/completed`. Consumido por `apps/web` via `EventSource` nativo do browser (`useRealtimeEvents`), que invalida/atualiza o cache do TanStack Query e dispara toasts sem full-page refresh. Implementado na Phase 14. Limitação conhecida: por ser in-process, não funciona entre múltiplas réplicas do backend sem migrar para um pub/sub distribuído — não implementado por não haver esse requisito hoje (ver ADR `0013-sse-instead-of-websocket.md`).

## Segurança

Autenticação + RBAC + object-level authorization vivem em `packages/auth`, aplicados no backend (`apps/api`). O frontend nunca é a fonte de verdade de permissão — ele consulta o backend e esconde/mostra UI de acordo, mas o backend rejeita qualquer ação não autorizada independentemente do que o frontend enviar. Nenhum ID recebido do frontend (`organizationId`, `userId`, `serviceId`) é confiável sem checagem de autorização no backend.

## Observability do produto vs. telemetria do próprio Nexus

São duas coisas diferentes, e só a primeira foi implementada. **Observability (produto, Phase 8)**: `apps/web` mostra logs/métricas/traces/erros de serviços cadastrados no catálogo, lidos de `packages/database` (populados por `seedDemoData` ou por adapters reais no futuro) — isso é uma feature completa e testada. **Telemetria do próprio Nexus (`packages/telemetry`)**: nunca saiu do scaffold vazio criado na Phase 0. Nenhuma fase criou uma necessidade concreta de instrumentar o runtime do `apps/api`/`apps/web` com OpenTelemetry real, e instalar `@opentelemetry/*` sem um caso de uso (dashboards, alerting, tracing distribuído de verdade) violaria a regra de não instalar dependência sem justificar. Ver `docs/decisions/0018-final-qa-doc-drift-cleanup.md`.

## Demo Mode

`packages/integrations` expõe `MockAdapter`, usado no lugar dos adapters reais (Phase 13) — gera repositórios/deployments/errors/métricas plausíveis sem nenhuma chamada de rede. `packages/database` tem um gerador de dataset de demonstração (`seedDemoData`) que popula times, services, deployments, pipelines, incidentes, observability (métricas/logs/traces/errors), APIs, documentação e feature flags — o produto fica demonstrável sem nenhuma credencial externa, mesmo antes das features de produto (Catalog, Deployments, ...) existirem.

## Estado por fase

Este documento descreve a arquitetura **alvo**. O estado real de cada camada evolui fase a fase — ver `NEXUS-SPECIFICATION.md` seção "Roadmap" e o histórico de commits para o que já está implementado.
