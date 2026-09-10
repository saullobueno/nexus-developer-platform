# CLAUDE.md

Guia para trabalhar neste repositório com Claude Code. Leia também `NEXUS-SPECIFICATION.md` (especificação de produto completa) e `ARCHITECTURE.md` (visão arquitetural) antes de implementar qualquer fase.

## O que é o Nexus

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, integrações e um AI Engineering Copilot. Implementado em fases (ver seção "Roadmap" em `NEXUS-SPECIFICATION.md`), começando pela Phase 0 — Foundation.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo.
- **Frontend** (`apps/web`): Next.js (App Router) + React + TypeScript strict + Tailwind v4 + shadcn/ui (em `packages/ui`). TanStack Query/Table, Zustand, React Hook Form, Zod, ECharts e Monaco chegam nas fases que os utilizam — não estão instalados na Phase 0.
- **Backend** (`apps/api`): NestJS + Drizzle ORM (`packages/database`) + PostgreSQL. Redis/BullMQ chegam quando houver jobs/filas reais.
- **Testes**: Vitest (unit/integration) + Testing Library + Playwright (e2e, em `tests/`) + Storybook (`packages/ui`).
- **AI**: Vercel AI SDK + Anthropic/OpenAI, em `packages/ai` — implementado na Phase 15.

## Comandos

Rodar sempre a partir da raiz (Turborepo cuida do escopo por pacote):

```bash
pnpm install         # instala tudo
pnpm dev             # turbo run dev (apps em modo watch)
pnpm lint            # eslint em todos os pacotes/apps
pnpm typecheck       # tsc --noEmit em todos os pacotes/apps
pnpm test            # vitest em todos os pacotes/apps
pnpm test:e2e        # playwright (tests/) — sobe apps/web automaticamente
pnpm build           # build de produção de tudo
pnpm format          # prettier --write
```

Para rodar em um único pacote: `pnpm --filter web dev`, `pnpm --filter api test`, etc.

## Estrutura

```text
apps/web            Next.js — frontend
apps/api            NestJS — backend
apps/docs           placeholder — escopo definido na Phase 9
packages/ui          design system (shadcn/ui) — source-only, sem build step
packages/database     Drizzle ORM + client Postgres — schema real chega na Phase 1
packages/auth         RBAC/autenticação — Phase 2
packages/ai           AI Gateway/Copilot — Phase 15
packages/integrations adapters (GitHub/Sentry/Grafana/Slack/Mock) — Phase 13
packages/telemetry    OpenTelemetry — incremental, ver spec seção 26
packages/config       tsconfig e eslint compartilhados (conteúdo real desde a Phase 0)
packages/types        tipos compartilhados — cresce com o data model (Phase 1+)
tests/                Playwright e2e cross-app
docs/                 architecture, decisions (ADRs), product, api, ai
```

Pacotes consumidos por `apps/api` (backend, precisa de JS compilado em runtime) têm um passo `build` real via `tsc`. `@nexus/ui` é a exceção: é source-only porque só é consumido por ferramentas que transpilam TS/JSX diretamente (Next.js via `transpilePackages`, Vite no Storybook/Vitest) — nunca pelo NestJS. Ver ADR `docs/decisions/0001-monorepo-tooling.md`.

## Convenções

- TypeScript strict em todo lugar, evitar `any`. Zod nas fronteiras (env vars, input de API).
- Componentes React pequenos, divididos por responsabilidade — nunca um componente gigante fazendo tudo.
- Regra de negócio no domínio/service layer; controllers do NestJS ficam finos.
- Autorização sempre no backend — o frontend só reflete permissões, nunca as impõe.
- Nunca confiar em IDs (`organizationId`, `userId`, `serviceId`) vindos do frontend sem checar autorização no backend.
- Toda feature nova precisa de: comportamento real + loading/empty/error/success states + autorização + testes + telemetry (quando relevante) + acessibilidade. Ver "Definition of Done" na spec.

## Regras operacionais

- **Não instalar dependência sem justificar.** Antes de adicionar uma lib, verificar se a stack já resolve o problema.
- **Não fazer big-bang implementation.** Implementar fase a fase (ver Roadmap), apresentando o plano antes de codar mudanças não triviais.
- **Não commitar sem pedido explícito do usuário.** Preparar as mudanças, mas deixar o commit para quando for solicitado.
- **Não desabilitar TypeScript, remover testes para o build passar, ou usar `eslint-disable` indiscriminadamente.**
- **Ao final de cada fase**, rodar `pnpm lint && pnpm typecheck && pnpm test && pnpm build` e reportar: Implemented / Tests / Decisions / Limitations / Next phase.

## Ambiente local conhecido

- Docker não estava disponível no ambiente em que a Phase 0 foi criada — `docker-compose.yml` existe mas não foi validado localmente rodando; validar antes de depender dele em CI/dev.
- `DEMO_MODE=true` (ver `.env.example`) deve permitir rodar o produto sem credenciais externas, usando mock adapters (Phase 3).
