# 0001 — Monorepo com pnpm + Turborepo

## Status
Aceita

## Contexto
O Nexus é composto por múltiplos apps (`web`, `api`, `docs`) e pacotes compartilhados (`ui`, `database`, `auth`, `ai`, `integrations`, `telemetry`, `config`, `types`) que precisam evoluir juntos, compartilhar tipos e configuração, e ser buildados/testados de forma incremental e cacheada. A spec (`NEXUS-SPECIFICATION.md` seção 24) já define essa estrutura de monorepo explicitamente.

## Decisão
Usar **pnpm workspaces** para gerenciamento de dependências (instalação determinística, `workspace:*` para linkar pacotes internos, `node_modules` estrito que evita dependências fantasma) e **Turborepo** para orquestração de tasks (`build`, `lint`, `typecheck`, `test`, `test:e2e`), com cache local baseado em hash de inputs e paralelização automática respeitando o grafo de dependências entre pacotes.

Pacotes de biblioteca consumidos por `apps/api` (NestJS, que precisa de JS já compilado em runtime) recebem um passo de build real via `tsc` (`database`, `auth`, `ai`, `integrations`, `telemetry`, `types`). Já `@nexus/ui`, que só é consumido por ferramentas que transpilam TS/JSX diretamente (Next.js via `transpilePackages`, Vite no Storybook e no Vitest), permanece **source-only**, sem passo de build — reduz um build step desnecessário sem quebrar nenhum consumidor real.

## Alternativas consideradas
- **Nx**: mais recursos (geradores, graph visual), mas overhead de configuração maior do que o necessário para o tamanho atual do projeto.
- **Múltiplos repositórios**: descartado — o objetivo do Nexus é demonstrar um monorepo coeso; múltiplos repos dificultariam compartilhar tipos/design system e contradiriam a spec.
- **npm/yarn workspaces sem Turborepo**: funcionaria, mas perderíamos cache de tasks e paralelização automática, relevantes à medida que o número de pacotes cresce nas próximas fases.

## Consequências
- CI e scripts locais rodam via `pnpm run <task>` → `turbo run <task>`, com cache automático.
- Cada pacote/app declara explicitamente suas próprias dependências (sem depender de hoisting implícito), o que é mais verboso mas evita dependências fantasma.
- A separação build-step vs. source-only por pacote (explicada acima) precisa ser lembrada ao criar novos pacotes: pacotes consumidos pelo `apps/api` precisam de build; pacotes só consumidos por ferramentas baseadas em Vite/Next não precisam.
