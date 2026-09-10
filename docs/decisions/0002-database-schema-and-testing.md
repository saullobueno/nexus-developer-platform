# 0002 — Schema do data model, geração de IDs e testes de integração sem Docker

## Status
Aceita

## Contexto
A Phase 1 exige implementar todas as entidades da spec (`NEXUS-SPECIFICATION.md` seção 23) com migrations, indexes e seed, e validar que o schema realmente funciona (não só que compila). O ambiente onde esta fase foi implementada não tem Docker instalado, então não havia como subir o Postgres do `docker-compose.yml` para rodar testes de integração reais.

## Decisões

### Organização do schema
O schema (`packages/database/src/schema/`) foi dividido em um arquivo por domínio (`organizations`, `identity`, `catalog`, `deployments`, `pipelines`, `incidents`, `observability`, `apis`, `documentation`, `feature-flags`, `integrations`, `notifications`, `ai`), cada um exportando suas tabelas e `relations()`. Um `_helpers.ts` centraliza a coluna de id e os timestamps para não repetir a definição em 40+ tabelas.

### Geração de UUID sem extensão do Postgres
Em vez de `gen_random_uuid()` (que exige a extensão `pgcrypto`) ou `uuid-ossp`, os ids são gerados na aplicação via `randomUUID()` do `node:crypto` (`$defaultFn` do Drizzle). Isso evita depender de gerenciar extensões do Postgres nas migrations, sem custo real — a geração acontece uma vez por insert, no processo Node, não em cada linha do banco.

### Testes de integração sem Docker
Como não há Postgres disponível localmente, os testes de integração do schema (`schema.integration.test.ts`) rodam contra **pglite** (`@electric-sql/pglite`), um Postgres real compilado para WASM que roda embutido no processo Node, sem Docker nem servidor externo. As migrations geradas pelo `drizzle-kit generate` são aplicadas de verdade (`drizzle-orm/pglite/migrator`) antes de cada suíte, e os testes fazem insert/query reais — não é um mock do schema.

Isso é estritamente para testes. Em desenvolvimento/produção, `packages/database` continua usando o driver `postgres-js` contra o Postgres real do `docker-compose.yml`.

## Alternativas consideradas
- **Testcontainers**: exigiria Docker, que não está disponível neste ambiente; também adiciona uma dependência de infraestrutura mais pesada para os testes de CI.
- **Mockar o Drizzle ORM**: rejeitado — testar um schema com mocks não verifica se as migrations e constraints (FKs, unique indexes) realmente funcionam contra um motor Postgres real.
- **SQLite em memória**: incompatível com features Postgres-específicas usadas no schema (enums nativos, `jsonb`, `numeric`), geraria falso positivo.

## Consequências
- `@electric-sql/pglite` é uma devDependency de `packages/database`, usada só em testes.
- Quando Docker estiver disponível, os mesmos testes podem futuramente rodar também contra Postgres real em CI (ex.: `services: postgres` no GitHub Actions) como camada adicional de confiança — não é necessário agora porque o pglite já executa o SQL real das migrations.
- Novas tabelas devem seguir o padrão de arquivo por domínio e usar `idColumn()`/`timestamps` de `_helpers.ts`.
