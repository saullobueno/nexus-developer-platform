# tests (e2e)

Testes end-to-end com Playwright, cruzando múltiplos apps do monorepo. Testes unitários e de integração ficam junto de cada pacote/app (`src/**/*.test.ts`), não aqui.

`pnpm test:e2e` sobe `apps/web` em modo dev na porta 4100 e roda as specs em `e2e/`.
