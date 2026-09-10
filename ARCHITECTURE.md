# Architecture

Visão arquitetural de alto nível do Nexus. Para o detalhamento de produto/features, ver `NEXUS-SPECIFICATION.md`. Para decisões pontuais justificadas, ver `docs/decisions/` (ADRs).

## Visão geral (C4 — nível de contexto)

```text
                         ┌────────────────────┐
                         │   Usuário (browser) │
                         └──────────┬──────────┘
                                    │ HTTPS
                          ┌─────────▼─────────┐
                          │   apps/web (Next)  │  UI, SSR/streaming, command palette
                          └─────────┬─────────┘
                                    │ REST + WebSocket/SSE
                          ┌─────────▼─────────┐
                          │   apps/api (Nest)  │  domínio, RBAC, realtime gateway, AI gateway
                          └───┬────────┬───────┘
                 ┌────────────┘        └────────────┐
        ┌────────▼────────┐                 ┌───────▼────────┐
        │   PostgreSQL     │                 │     Redis      │  cache, filas (BullMQ)
        │  (via Drizzle)   │                 └────────────────┘
        └──────────────────┘
                                    │
                     ┌──────────────┴───────────────┐
                     │   packages/integrations       │  adapters (GitHub/Sentry/Grafana/Slack)
                     │   packages/ai                 │  providers (Anthropic/OpenAI) + tools
                     └────────────────────────────────┘
```

## Camadas e separação de responsabilidades

- **Apresentação** (`apps/web`): só UI e orquestração de dados via TanStack Query. Não contém regra de negócio nem decide autorização — apenas reflete o que o backend permite.
- **Domínio/serviço** (`apps/api/src/**/*.service.ts`, por módulo de feature): regra de negócio, validação, autorização real. Controllers ficam finos — só roteiam requests e delegam ao domínio.
- **Infraestrutura** (`packages/database`, `packages/telemetry`): acesso a Postgres/Redis e instrumentação, sem conhecimento de regra de negócio.
- **Integração** (`packages/integrations`): todo acesso a sistemas externos (GitHub, Sentry, Grafana, Slack) passa por uma interface `IntegrationProvider`, nunca é chamado diretamente do domínio. Isso permite trocar um provider real por `MockAdapter` (Demo Mode) sem tocar em regra de negócio.
- **AI** (`packages/ai`): Gateway de IA com tool calling. Tools de leitura (`get_service`, `search_logs`, etc.) e tools mutáveis (`rollback_deployment`, `trigger_deployment`, etc.) — mutáveis sempre exigem aprovação humana explícita antes de executar.

## Monorepo

pnpm workspaces + Turborepo. Ver ADR `0001-monorepo-tooling.md` para a justificativa e para a regra de quais pacotes têm passo de build (`tsc`) vs. quais são source-only (consumidos diretamente por bundlers).

## Realtime

WebSocket/SSE emitido por `apps/api` para eventos tipados (`deployment.*`, `incident.*`, `service.health.changed`, `notification.created`, `ai.run.*`). Consumido por `apps/web` para atualizar o cache do TanStack Query sem full-page refresh. Implementado na Phase 14.

## Segurança

Autenticação + RBAC + object-level authorization vivem em `packages/auth`, aplicados no backend (`apps/api`). O frontend nunca é a fonte de verdade de permissão — ele consulta o backend e esconde/mostra UI de acordo, mas o backend rejeita qualquer ação não autorizada independentemente do que o frontend enviar. Nenhum ID recebido do frontend (`organizationId`, `userId`, `serviceId`) é confiável sem checagem de autorização no backend.

## Demo Mode

`packages/integrations` expõe `MockAdapter`, usado no lugar dos adapters reais (Phase 13) — gera repositórios/deployments/errors/métricas plausíveis sem nenhuma chamada de rede. `packages/database` tem um gerador de dataset de demonstração (`seedDemoData`) que popula times, services, deployments, pipelines, incidentes, observability (métricas/logs/traces/errors), APIs, documentação e feature flags — o produto fica demonstrável sem nenhuma credencial externa, mesmo antes das features de produto (Catalog, Deployments, ...) existirem.

## Estado por fase

Este documento descreve a arquitetura **alvo**. O estado real de cada camada evolui fase a fase — ver `NEXUS-SPECIFICATION.md` seção "Roadmap" e o histórico de commits para o que já está implementado.
