# Nexus Developer Platform

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, integrações e um AI Engineering Copilot — construído para demonstrar React/TypeScript avançado, full-stack, monorepo, platform engineering, observability, RBAC, integrações e AI agents.

> **Status atual: Phase 0 — Foundation.** O produto ainda não tem features implementadas; esta fase estabeleceu o monorepo, ferramentas e pipelines de qualidade. Ver `NEXUS-SPECIFICATION.md` para a especificação completa e o roadmap de fases.

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
