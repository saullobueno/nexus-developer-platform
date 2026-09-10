# CLAUDE.md

Guia para trabalhar neste repositório com Claude Code. Leia também `NEXUS-SPECIFICATION.md` (especificação de produto completa) e `ARCHITECTURE.md` (visão arquitetural) antes de implementar qualquer fase.

## O que é o Nexus

Internal Developer Portal (IDP) production-grade: catálogo de serviços, deployments, incidentes, observability, feature flags, pipelines, integrações e um AI Engineering Copilot. Implementado em fases (ver seção "Roadmap" em `NEXUS-SPECIFICATION.md`), começando pela Phase 0 — Foundation.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo.
- **Frontend** (`apps/web`): Next.js (App Router) + React + TypeScript strict + Tailwind v4 + shadcn/ui (em `packages/ui`). TanStack Query + React Hook Form + Zod desde a Phase 4 (sessão, login, dashboard). TanStack Table, Zustand, ECharts e Monaco chegam nas fases que os utilizam.
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
packages/database     Drizzle ORM + client Postgres — schema completo (Phase 1), testado via pglite
packages/auth         JWT + RBAC (Phase 2) — guards/decorators desacoplados de @nexus/database
packages/ai           AI Gateway/Copilot — Phase 15
packages/integrations IntegrationProvider + MockAdapter (Phase 3) — adapters reais na Phase 13
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
- `DEMO_MODE=true` (ver `.env.example`) deve permitir rodar o produto sem credenciais externas, usando `@nexus/integrations` `MockAdapter`. Para popular um banco local com dados de demonstração completos (times, services, deployments, incidentes, observability, APIs, docs, flags), rode `pnpm --filter @nexus/database db:seed:demo`.
- Os testes de integração de `packages/database` rodam contra **pglite** (Postgres real em WASM, sem Docker) — ver `docs/decisions/0002-database-schema-and-testing.md`. Isso não substitui ter um Postgres real via `docker-compose.yml` para desenvolvimento/produção.
- Auth no frontend (`apps/web`) é client-side: `<AuthGuard>` chama `GET /auth/me` (cookie httpOnly) e redireciona para `/login` se falhar. Isso é uma simplificação da Phase 4 — não protege contra flash de conteúdo em SSR nem substitui um middleware/verificação server-side; considerar isso na Phase 17 (Security hardening).
- `apps/api` precisa de `app.enableCors({ origin: WEB_APP_URL, credentials: true })` (já configurado em `main.ts`) para o browser aceitar o cookie `nexus_token` em requests cross-port (`localhost:3000` → `localhost:3001`). Se o frontend rodar em outra porta/domínio, ajuste `WEB_APP_URL`.
- A tabela `documents` não tem `serviceId` — a tab "Documentation" do Service Detail mostra um empty state honesto em vez de inventar uma relação. Resolver isso é trabalho da Phase 9 (APIs/Docs).
- `@tanstack/react-table` não foi adotado (a versão publicada é a 9.x, com API muito diferente da v8 e sem documentação acessível no momento) — `/catalog` usa uma tabela HTML simples, já que busca/filtro/paginação são feitos no backend. Ver ADR `docs/decisions/0005-catalog-table-without-tanstack-table.md` antes de tentar de novo.
