# Nexus Developer Platform

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, integrações e um AI Engineering Copilot — construído para demonstrar React/TypeScript avançado, full-stack, monorepo, platform engineering, observability, RBAC, integrações e AI agents.

> **Status atual: Phase 5 — Service Catalog.** Foundation, Database, Auth/RBAC, Demo Mode e Home completos; o Catalog (`/catalog`, `/catalog/services/[slug]`) já lista os 8 services com busca/filtros/paginação reais e mostra o detalhe completo (Overview, Deployments, Environments, Observability, API, Dependencies, Documentation, Incidents, Activity). As demais features de produto (deployments, incidentes, observability dedicados, etc.) chegam nas próximas fases. Ver `NEXUS-SPECIFICATION.md` para a especificação completa e o roadmap de fases.

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
