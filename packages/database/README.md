# @nexus/database

Conexão Postgres via Drizzle ORM (`postgres-js`) e validação de `DATABASE_URL` via Zod.

O schema de domínio (`src/schema`) está vazio nesta fase — as entidades da spec seção 23 (User, Service, Deployment, Incident, ...) são adicionadas na Phase 1, junto com migrations e seed.

## Scripts
- `pnpm db:generate` — gera migrations a partir do schema.
- `pnpm db:migrate` — aplica migrations no banco.
- `pnpm db:studio` — abre o Drizzle Studio.
