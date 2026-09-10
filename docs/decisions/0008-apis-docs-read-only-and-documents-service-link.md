# 0008 — APIs/Docs somente leitura, e `documents` ganha `serviceId`

## Status
Aceita

## Contexto
A spec da Phase 9 pede um API Catalog (Overview, Endpoints, Schema, Documentation, Consumers, Health, Activity) e uma seção de Documentation (Getting Started, Architecture, Services, APIs, Runbooks, Engineering Standards, ADRs). O schema de `apis`/`api_endpoints`/`api_consumers`/`documents`/`document_versions`/`adrs` já existia desde a Phase 1, mas `documents` não tinha `serviceId` — um gap documentado no `CLAUDE.md` desde a Phase 5, quando a tab "Documentation" do Service Detail precisou de um empty state honesto em vez de inventar uma relação inexistente.

## Decisão
- Adicionada a coluna `documents.service_id` (nullable, `onDelete: "set null"`), permitindo vincular um documento a um serviço sem tornar isso obrigatório (documentos como "Getting Started" ou "Padrões de Engenharia" são org-wide, não específicos de um serviço). Migration `0003`.
- `ApisModule` e `DocsModule` (novos, em `apps/api/src`) são **somente leitura** nesta fase — sem `POST/PATCH/DELETE`. A spec não pede mutações para esta fase (diferente de Feature Flags, que explicitamente pede "toda alteração gera AuditLog" na Phase 10); então não há CRUD de APIs/Docs pela UI ainda.
- `ApisService.getBySlug` monta a tab "Activity" lendo `audit_logs` filtrado por `resource = "api"` — a mesma tabela já usada por Deployments/Incidents/Feature Flags futuras. Como não há mutações de API nesta fase, essa tab começa vazia no demo (empty state real, não fake).
- `ApiTab` e `DocumentationTab` do Service Detail (Phase 5) agora linkam para `/apis/:slug` e `/docs/:slug` respectivamente, fechando o gap.
- Novas permissions `apis:read` e `docs:read` adicionadas a `BASELINE_PERMISSIONS` e concedidas a todas as roles baseline (mesmo padrão de `services:read`), já que não há necessidade de restringir leitura de catálogo de APIs/documentação por role nesta fase.
- `react-markdown` adicionado a `apps/web` para renderizar `documents.content` (Markdown) na Documentation — é a forma padrão de renderizar Markdown sem `dangerouslySetInnerHTML` (evita XSS), e a spec pede suporte a Markdown/MDX explicitamente.

## Alternativas consideradas
- **Adicionar uma tabela de junção `document_services` (N:N)**: rejeitado — nenhum caso de uso da spec pede um documento vinculado a múltiplos serviços; `serviceId` nullable 1:N é suficiente e mais simples.
- **Adicionar CRUD de APIs/Docs agora**: rejeitado — não pedido pela spec desta fase; adicionar mutações sem endpoints de escrita especificados seria inventar escopo.
- **remark-gfm para tabelas Markdown**: rejeitado por ora — o conteúdo do seed não usa tabelas; adicionar o plugin sem um caso de uso real violaria "não instalar dependência sem justificar".

## Consequências
- Quando a Phase 16 (Settings/Audit) ou uma fase futura adicionar edição de documentos/APIs pela UI, `AuditService.record` já pode ser chamado com `resource: "api"` / `resource: "document"` sem mudança de schema.
- Endpoints com `requestSchema`/`responseSchema` nulos (a maioria do seed, exceto `POST /payments` em `payments-api`) mostram "Sem schema definido" no Schema tab — um estado honesto, não um placeholder fake.
