# @nexus/ui

Design system compartilhado (base shadcn/ui + Tailwind v4). Pacote **source-only**: não há passo de build — o TSX em `src/` é transpilado diretamente por quem consome (Next.js via `transpilePackages`, Vite no Storybook e no Vitest). Isso é possível porque `@nexus/ui` nunca é importado por `apps/api` (NestJS), que exige artefatos JS compilados.

Componentes de domínio adicionais (`ServiceStatusBadge`, `HealthIndicator`, `MetricCard`, etc., ver spec seção 33) são adicionados nas fases que os utilizam.

## Scripts
- `pnpm test` — Vitest + Testing Library.
- `pnpm storybook` — Storybook em modo dev.
- `pnpm build-storybook` — build estático do Storybook.
