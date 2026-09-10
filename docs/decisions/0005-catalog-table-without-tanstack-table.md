# 0005 — Catalog DataTable sem TanStack Table

## Status
Aceita

## Contexto
O stack (`NEXUS-CLAUDE-CODE-PROMPT.md` seção 2) lista TanStack Table para tabelas de dados, e a Phase 5 pede uma "listagem com DataTable". Ao tentar adicionar `@tanstack/react-table` (última versão publicada, 9.x), a API pública mudou de forma significativa em relação à v8 (`useReactTable` → `ReactTable`, `getCoreRowModel` → `createCoreRowModel`, `ColumnDef` agora exige 2–3 type arguments), sem que eu tivesse acesso à documentação da v9 para confirmar o uso correto.

## Decisão
A listagem de `/catalog` usa uma tabela HTML simples (`<table>` semântico + Tailwind) em vez de `@tanstack/react-table`. Busca, filtros e paginação já são feitos no backend (`GET /services`) — o valor real de uma table library (row model, sorting/filtering client-side, column visibility) não se aplica aqui, já que não há nenhum processamento client-side dos dados da página atual.

## Alternativas consideradas
- **Adotar `@tanstack/react-table` v9 mesmo sem documentação**: rejeitado — arriscar uma API desconhecida sem conseguir validar contra a doc oficial teria custo alto (tentativa e erro) para um ganho que não existe neste caso de uso (paginação/filtro server-side).
- **Pinar uma versão 8.x mais antiga**: possível, mas adicionaria uma dependência só para prover uma abstração (row model) que uma tabela HTML simples já resolve; não há necessidade concreta hoje.

## Consequências
- Se uma tela futura precisar de funcionalidades client-side reais de tabela (ordenação instantânea, reordenar/ocultar colunas, seleção em massa — ex.: Reports ou uma versão mais rica do Catalog), reavaliar `@tanstack/react-table` na versão então atual, com acesso à documentação correspondente.
- `ServicesDataTable` (`apps/web/components/catalog/services-data-table.tsx`) é intencionalmente simples — não é o lugar para adicionar lógica de sorting/filtering client-side sem antes revisitar esta decisão.
