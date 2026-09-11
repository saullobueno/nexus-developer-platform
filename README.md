# Nexus Developer Platform

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, times, relatórios, integrações, realtime e um AI Engineering Copilot com tool calling real e aprovação humana. Construído fase a fase (20 fases, ver `NEXUS-SPECIFICATION.md`) para demonstrar **React + TypeScript + Full-stack + Monorepo + Platform Engineering + Observability + Realtime + RBAC + Integrations + AI Agents + Testing + Security + Product Design**.

> **Status: todas as 20 fases do roadmap concluídas** (Foundation → Documentation/Final QA). A spec (`NEXUS-SPECIFICATION.md` seção 34) enumera 21 itens porque separa Settings e Audit; na implementação, as duas foram tratadas como uma única fase (Phase 16) por compartilharem a mesma tela (`/settings`) e o mesmo `SettingsService` — daí 20 fases em vez de 21. Cada fase foi implementada, testada (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`) e commitada isoladamente — ver histórico de commits e `docs/decisions/` (18 ADRs) para o racional de cada decisão não trivial.

## Screenshots

Não incluídas neste README — gerar screenshots de verdade exigiria rodar o produto localmente com dados de demo e capturar telas manualmente (`pnpm dev` + `db:seed:demo`, ver "Rodando localmente" abaixo). Preferimos não incluir imagens placeholder/fabricadas.

## Arquitetura

Visão completa em `ARCHITECTURE.md` (C4 de contexto, camadas, realtime, segurança, demo mode). Resumo:

- **`apps/web`** (Next.js 16 + React 19, App Router): só UI e orquestração via TanStack Query. `AuthGuard` client-side chama `GET /auth/me` e redireciona para `/login` se falhar — não há verificação de sessão no servidor durante SSR (limitação conhecida, ver `CLAUDE.md`).
- **`apps/api`** (NestJS 12): domínio, RBAC, autorização por objeto, realtime (SSE) e AI gateway. Controllers finos, regra de negócio nos `*.service.ts`.
- **`packages/database`**: schema Drizzle completo + client Postgres, testado via `@electric-sql/pglite` (Postgres real em WASM, sem Docker).
- **`packages/auth`**: JWT + RBAC + hashing (bcrypt) + autorização por objeto, desacoplado de `@nexus/database`.
- **`packages/integrations`**: `IntegrationProvider` + adapters reais (GitHub, Sentry, Grafana, Slack) com fallback automático para `MockAdapter` (Demo Mode).
- **`packages/ai`**: gateway de IA com tool calling real (Vercel AI SDK v7 + Anthropic/OpenAI) e um orchestrator demo determinístico (zero rede) usado quando não há credenciais.
- **`packages/ui`**: design system próprio sobre primitivas Radix UI (Dialog, Tabs, Switch) + Tailwind v4 — acessibilidade (focus trap, navegação por teclado, ARIA) herdada das primitivas.

## Stack

pnpm + Turborepo · Next.js 16 + React 19 + TypeScript strict · Tailwind v4 + design system próprio (`packages/ui`, base Radix UI) · NestJS 12 · PostgreSQL + Drizzle ORM · Vercel AI SDK v7 (Anthropic/OpenAI) · Vitest + Testing Library + Playwright + Storybook · GitHub Actions.

Sem Redis/BullMQ/WebSocket: nenhuma fase criou uma necessidade real de fila em background, e o realtime (SSE) é resolvido inteiramente em-processo — ver `docs/decisions/0013-sse-instead-of-websocket.md` e `docs/decisions/0018-final-qa-doc-drift-cleanup.md`. Ver `CLAUDE.md` para a lista completa de dependências e o racional de quando cada uma foi introduzida.

## Features por área

- **Auth/RBAC**: login JWT (cookie httpOnly), 5 roles baseline (Admin, Platform Engineer, Tech Lead, Developer, Viewer), permissões `resource:action`, autorização por objeto em toda query (nunca confia em IDs vindos do frontend).
- **Service Catalog**: busca/filtro/paginação (server-side, com debounce), detail page com dependências, deployments recentes, incidentes, métricas, APIs e documentação relacionados.
- **Deployments**: timeline por ambiente, ações (promote/rollback) auditadas e com realtime.
- **Incidents**: criação, timeline de eventos, severidade, postmortem, serviços afetados.
- **Observability**: logs (busca por `level:`/`service:`/`trace:`), métricas (gráficos ECharts), traces (waterfall), erros — tudo paginado no backend.
- **APIs/Docs**: catálogo de APIs por serviço, documentos/ADRs renderizados em Markdown.
- **Feature Flags**: boolean/percentage/user/org/rule-based, editor de regras, toggle com optimistic update, activity log.
- **Pipelines**: timeline Build → Unit Tests → Integration Tests → Security → Deploy, histórico de runs.
- **Teams/Reports**: KPIs por time (uptime, MTTR, deployment frequency), relatórios agregados.
- **Integrations**: GitHub/Sentry/Grafana/Slack com adapters reais + fallback automático para mock, config mascarada em respostas e audit logs.
- **Realtime**: SSE tipado (`deployment.*`, `incident.*`, `ai.run.*`) com toasts no frontend.
- **AI Engineering Copilot**: pergunta em linguagem natural → tool calling (12 tools de leitura, 4 mutáveis) → evidências derivadas mecanicamente das respostas reais das tools (nunca inventadas pelo LLM) → ações mutáveis exigem aprovação humana explícita antes de executar.
- **Settings/Audit**: organização, membros (troca de role), roles (leitura), environments, integrations, **webhooks** (segredo hasheado com bcrypt, mostrado em texto puro só na criação), audit logs filtráveis.
- **Security hardening**: rate limiting (`@nestjs/throttler`, global + restrito em `/auth/login`), security headers (`helmet`), cookies seguros (`httpOnly`/`secure`/`sameSite`).
- **Performance/Accessibility**: debounce em toda busca, optimistic update no toggle de flags, skip-link, `aria-current`/`aria-label` na navegação, `prefers-reduced-motion`.

## Arquitetura de IA

`packages/ai` implementa um orchestrator dual, espelhando o padrão `resolveAdapter` do Demo Mode:

- **Demo orchestrator** (sem credenciais/rede): faz keyword-matching da pergunta contra os tools disponíveis, executa os tools reais contra o banco, e deriva `findings`/`evidence` **mecanicamente** a partir do output real — nunca pede ao LLM para "inventar" achados estruturados.
- **Real orchestrator** (com `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`): `generateText` + `tool()` + `stopWhen: stepCountIs(5)` (Vercel AI SDK v7) contra Anthropic/OpenAI, com as mesmas 16 tools.
- **Aprovação humana**: as 4 tools mutáveis (`rollback_deployment`, `create_incident`, `update_feature_flag`, `trigger_deployment`) nunca executam sozinhas — ficam como `ai_tool_calls` pendentes até um humano chamar `POST /ai-copilot/tool-calls/:id/approve`, que then chama o service real (auditado).

Ver `docs/decisions/0014-ai-copilot-demo-orchestrator-and-mechanical-evidence.md`.

## Integrações

`packages/integrations` expõe uma interface única (`IntegrationProvider`) para GitHub, Sentry, Grafana e Slack — cada uma com um adapter real (chamadas HTTP de verdade) e fallback automático para `MockAdapter` quando `DEMO_MODE=true` ou quando a chamada real falha. Configs são mascaradas (`••••••••`) em toda resposta de API e em audit logs. Ver `docs/decisions/0012-real-adapters-fallback-to-mock.md`.

## Testing

- **Unit/integration** (Vitest): `packages/database` e `apps/api` rodam contra Postgres real em WASM (`@electric-sql/pglite`) — sem Docker, sem mocks de ORM. `apps/web`/`packages/ui` usam Testing Library.
- **E2E** (Playwright, `tests/`): smoke test cross-app, sobe `apps/web` automaticamente.
- **Storybook** (`packages/ui`): stories para os componentes de domínio (`ServiceStatusBadge`, `MetricCard`, `ActivityTimeline`, etc.).
- Todo endpoint de listagem tem teste de **autorização por objeto** plantando dados de uma segunda organização e confirmando 404/vazio — repetido consistentemente em praticamente todo módulo desde a Phase 2.

## Observability

Duas coisas diferentes — só a primeira existe: **Observability (produto)** mostra logs/métricas/traces/erros de serviços do catálogo (Phase 8, real, testado). **Telemetria do próprio Nexus** (`packages/telemetry`) nunca saiu do scaffold vazio da Phase 0 — nenhuma fase criou um caso de uso concreto para instrumentar `apps/api`/`apps/web` com OpenTelemetry real. Ver `docs/decisions/0018-final-qa-doc-drift-cleanup.md`.

## Security

Autenticação JWT (cookie httpOnly, `secure` em produção, `sameSite=lax`), RBAC por permissão (`resource:action`), autorização por objeto em toda query (nunca confia em `organizationId`/`userId`/`serviceId` do frontend), validação Zod em toda fronteira de API, rate limiting (`@nestjs/throttler`, global + restrito em `/auth/login`), security headers (`helmet`), segredos hasheados com bcrypt (senhas e webhooks), audit log completo com UI filtrável. Gaps documentados e não implementados (sem infraestrutura real por trás, não fabricados): 2FA, SSO/OAuth, criptografia em repouso para configs de integração, verificação de sessão no servidor durante SSR. Ver `docs/decisions/0016-security-hardening-rate-limiting-headers-webhooks.md`.

## Rodando localmente

```bash
pnpm install
cp .env.example .env            # e apps/web/.env.example, apps/api/.env.example
pnpm dev
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

### Com Postgres real (dados de demonstração)

```bash
docker compose up -d                            # Postgres
pnpm --filter @nexus/database db:migrate
pnpm --filter @nexus/database db:seed:demo
```

**Credenciais de demo:** qualquer usuário criado pelo seed faz login com a senha `demo1234` — por exemplo `admin@acme.test` (role Admin). O formulário de login já vem pré-preenchido com essas credenciais para facilitar a demonstração.

`DEMO_MODE=true` (padrão) faz o produto funcionar de ponta a ponta sem nenhuma credencial externa — integrações usam `MockAdapter`, e o AI Copilot usa o orchestrator demo (determinístico, sem chamada de rede). Para usar o AI Copilot real, defina `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` em `apps/api/.env`.

## Estrutura

```text
apps/        web (Next.js), api (NestJS), docs (placeholder)
packages/    ui, database, auth, ai, integrations, telemetry, config, types
docs/        architecture, decisions (18 ADRs), product, api, ai
tests/       e2e (Playwright)
```

Detalhes de cada pacote em `CLAUDE.md`. Visão arquitetural completa em `ARCHITECTURE.md`.

## Desenvolvimento assistido por IA

Todo o código deste projeto — as 20 fases do roadmap, testes, ADRs e este README — foi implementado com Claude Code, seguindo um processo disciplinado: plano apresentado antes de mudanças não triviais, uma fase por vez (nunca big-bang), validação completa (`lint && typecheck && test && build && test:e2e`) ao final de cada fase antes de commitar, e 18 ADRs registrando toda decisão não óbvia — incluindo os limites do que foi decidido não construir (ver `docs/decisions/0015-settings-scope-and-honest-gaps.md` e `0018-final-qa-doc-drift-cleanup.md`), em vez de simular funcionalidade sem infraestrutura real por trás.

## Documentação

- `NEXUS-SPECIFICATION.md` — especificação de produto completa.
- `ARCHITECTURE.md` — visão arquitetural.
- `docs/decisions/` — 18 ADRs, uma por decisão não trivial, em ordem cronológica pelas fases.
- `CLAUDE.md` / `AGENTS.md` — guia para desenvolvimento assistido por agentes de IA.
