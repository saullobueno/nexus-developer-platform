import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    // Vários arquivos de integração sobem seu próprio Postgres via pglite. Rodar em
    // paralelo sob carga (ex.: junto de outros pacotes no turbo run test) pode estourar
    // o hookTimeout por contenção de recursos, não por bug — preferimos confiabilidade.
    fileParallelism: false,
  },
});
