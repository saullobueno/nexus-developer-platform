# Nexus Developer Platform

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, integrações e um AI Engineering Copilot — construído para demonstrar React/TypeScript avançado, full-stack, monorepo, platform engineering, observability, RBAC, integrações e AI agents.

> **Status atual: Phase 18 — Performance/Accessibility.** Foundation, Database, Auth/RBAC, Demo Mode, Home, Service Catalog, Deployments, Incidents, Observability, APIs/Docs, Feature Flags, Pipelines, Teams/Reports, Integrations, Realtime, AI Copilot, Settings/Audit e Security hardening completos. Esta fase adicionou debounce (300ms) nas 8 telas com busca/filtro que antes disparavam uma requisição por tecla digitada, optimistic update no toggle de feature flags (com rollback automático em caso de erro), e melhorias de acessibilidade no AppShell: skip-link para o conteúdo principal, `aria-current`/`aria-label` na navegação lateral (mesmo colapsada) e suporte a `prefers-reduced-motion`. Dialogs, Tabs e Switch já herdavam navegação por teclado e focus trap das primitivas Radix UI usadas desde o início. Ver ADR `docs/decisions/0017-performance-accessibility-debounce-optimistic-updates.md` para o detalhamento e os gaps documentados (SSR/streaming, virtualization). Ver `NEXUS-SPECIFICATION.md` para a especificação completa e o roadmap de fases.

## Stack

pnpm + Turborepo · Next.js + React + TypeScript strict · Tailwind + shadcn/ui · NestJS · PostgreSQL + Drizzle · Redis + BullMQ · Vercel AI SDK · Vitest + Playwright + Storybook · GitHub Actions.

Ver `CLAUDE.md` para a lista completa e o racional de quando cada dependência é introduzida.

## Rodando localmente

```bash
pnpm install
cp .env.example .env            # e apps/web/.env.example, apps/api/.env.example
pnpm dev
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### Com Postgres real (dados de demonstração)

```bash
docker compose up -d                            # Postgres + Redis
pnpm --filter @nexus/database db:migrate
pnpm --filter @nexus/database db:seed:demo
```

**Credenciais de demo:** qualquer usuário criado pelo seed faz login com a senha `demo1234` — por exemplo `admin@acme.test` (role Admin).

## Estrutura

```text
apps/        web (Next.js), api (NestJS), docs (placeholder)
packages/    ui, database, auth, ai, integrations, telemetry, config, types
docs/        architecture, decisions (ADRs), product, api, ai
tests/       e2e (Playwright)
```

Detalhes de cada pacote em `CLAUDE.md`. Visão arquitetural em `ARCHITECTURE.md`.

## Documentação

- `NEXUS-SPECIFICATION.md` — especificação de produto completa.
- `ARCHITECTURE.md` — visão arquitetural.
- `docs/decisions/` — ADRs.
- `CLAUDE.md` / `AGENTS.md` — guia para desenvolvimento assistido por agentes de IA.

Este README será expandido a cada fase (screenshots, arquitetura de IA, integrações, observability, segurança, credenciais de demo) conforme as features forem implementadas.
