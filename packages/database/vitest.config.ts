import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    hookTimeout: 90_000,
    testTimeout: 30_000,
    // Vários arquivos de integração sobem seu próprio Postgres via pglite. Rodar em
    // paralelo sob carga (ex.: junto de outros pacotes no turbo run test) pode estourar
    // o hookTimeout por contenção de recursos, não por bug — preferimos confiabilidade.
    // demo-seed.integration.test.ts roda o seedDemoData inteiro (leva ~25s isolado);
    // sob `pnpm test` do monorepo inteiro (web+ui+api+database disputando CPU ao mesmo
    // tempo via turbo) isso já estourou 30s e depois 45s — 90s dá folga real sem mascarar
    // hooks de fato travados (ver mesmo ajuste em apps/api/vitest.config.mts, Phase 9).
    fileParallelism: false,
  },
});
