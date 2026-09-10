# 0009 — Editor de regras de feature flag em JSON bruto, não um formulário por tipo

## Status
Aceita

## Contexto
A spec da Phase 10 pede 5 tipos de feature flag (Boolean, Percentage, User targeting, Organization targeting, Rule-based) e que o detail mostre rollout e regras, com o exemplo `Enterprise 100% / Beta 100% / Everyone 45%`. O schema (`feature_flag_rules`, desde a Phase 1) já modela isso de forma flexível: `kind: varchar` + `value: jsonb`, sem uma coluna por tipo de regra.

## Decisão
- O editor de regras (`RulesEditor`, `apps/web/components/feature-flags/rules-editor.tsx`) expõe cada regra como dois campos: `kind` (texto livre) e `value` (textarea de uma linha com JSON bruto), com botões para adicionar/remover linhas e um único "Salvar" que faz `PUT /feature-flags/:key/rules` substituindo o array inteiro — não um formulário dedicado por tipo (ex.: um slider % para "percentage", um select de segmento para "segment").
- `formatRolloutSummary` (`apps/web/lib/rollout-summary.ts`) interpreta `kind`/`value` de forma best-effort para gerar a frase de resumo (`"Enterprise 100%"`, `"Everyone 45%"`), com fallback `"${kind}: ${JSON.stringify(value)}"` para kinds desconhecidos — não quebra para regras que a UI não modela explicitamente.
- Toggle (`PATCH /feature-flags/:key/toggle`) e replace de regras (`PUT /feature-flags/:key/rules`) são as duas únicas mutações; ambas chamam `AuditService.record` com `before`/`after`, satisfazendo "toda alteração gera AuditLog" da spec.
- `AuditService` ganhou `listForResource(organizationId, resource, resourceId)`, extraído da query que já existia duplicada em `ApisService.getBySlug` (Phase 9) — agora reaproveitada também por `FeatureFlagsService.getByKey` para a aba Activity.
- Adicionado `Switch` a `packages/ui` (via `@radix-ui/react-switch`) — primeiro toggle on/off do design system; usado tanto na listagem quanto no detail.

## Alternativas consideradas
- **Formulário tipado por `type` da flag (slider de % para percentage, multi-select de segmentos para targeting)**: rejeitado por agora — geraria 5 componentes de edição diferentes para um schema que é genuinamente `kind`+`value` livre, e a spec não pede uma UX específica além de "mostrar rollout e regras". Se um tipo de regra se tornar central ao produto, vale revisitar com um componente dedicado só para ele.
- **Monaco Editor para o JSON de `value`**: rejeitado — Monaco é escopo da Phase 15 (justificado lá pelo AI Copilot/editor de código); um `<textarea>`/`Input` de uma linha já resolve o volume de JSON usado aqui (objetos pequenos, ex. `{"percentage": 45}`).

## Consequências
- Um erro de JSON no campo `value` é pego no cliente antes do submit (mensagem "não é um JSON válido"); o backend ainda valida a forma geral via Zod (`kind: string`, `value: record`), mas não valida a semântica de cada `kind` — isso é aceitável dado que `kind` é livre por design.
- Se a Phase 16 (Settings/Audit) adicionar uma página dedicada de audit log organization-wide, `AuditService.listForResource` já dá a base para uma futura `list(organizationId, filters)` mais genérica.
