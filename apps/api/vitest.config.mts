import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    // Cada arquivo e2e sobe seu próprio Postgres via pglite e roda o demo-seed inteiro
    // (centenas de inserts). Rodar em paralelo sob carga (ex.: junto de outros pacotes
    // no turbo run test) estoura o hookTimeout por contenção de recursos, não por bug —
    // preferimos confiabilidade a velocidade aqui.
    fileParallelism: false,
  },
});
