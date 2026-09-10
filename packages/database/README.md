# @nexus/database

Conexão Postgres via Drizzle ORM (`postgres-js`), schema completo do data model (`src/schema`, spec seção 23) e seeds.

## Scripts
- `pnpm db:generate` — gera migrations a partir do schema.
- `pnpm db:migrate` — aplica migrations no banco.
- `pnpm db:studio` — abre o Drizzle Studio.
- `pnpm db:seed` — cria a organização, roles/permissions baseline e um usuário admin demo (`admin@acme.test` / `demo1234`). Idempotente — pode rodar quantas vezes quiser.
- `pnpm db:seed:demo` — além do baseline, popula um dataset de demonstração completo: os 6 times e 8 services da spec (seção 27), usuários por time, deployments, pipelines, incidentes, métricas, logs, traces/spans, error events, APIs, documentos, ADR e feature flags. **Não é idempotente** para as tabelas sem chave natural (deployments, métricas, logs, etc.) — rode uma vez contra um banco limpo (ou após resetar as migrations).

## Testes
Testes de integração rodam contra **pglite** (Postgres real em WASM, sem Docker) — ver `docs/decisions/0002-database-schema-and-testing.md`.
