# 0010 — Pipelines é uma view dedicada sobre o schema já existente desde a Phase 1

## Status
Aceita

## Contexto
A spec da Phase 11 pede um "Pipeline visual: `Build → Unit Tests → Integration Tests → Security → Deploy`, cada stage com status, duration e logs". As tabelas `pipelines`, `pipeline_runs` e `pipeline_stages` já existiam desde a Phase 1 e já eram populadas pelo demo-seed (uma pipeline por serviço, uma run por deployment, 5 stages por run) — a Phase 6 (Deployments) já consumia essas mesmas tabelas para mostrar o pipeline de um deployment específico dentro do Deployment Detail (`DeploymentTimeline`, ver ADR 0006).

## Decisão
- Nenhuma mudança de schema foi necessária. `PipelinesModule` (novo, `apps/api/src/pipelines`) é somente leitura sobre `pipelines`/`pipeline_runs`/`pipeline_stages`, sempre escopado por `organizationId` via join com `services`.
- `/pipelines` é uma visão dedicada, cross-service, do que já existia embutido em cada Deployment Detail — permite navegar pipelines e o histórico de execuções sem passar por um deployment específico primeiro.
- `DeploymentTimeline` (app-local a `apps/web/components/deployments`, sem teste dedicado) foi promovido para `packages/ui` como `PipelineTimeline`, com um tipo genérico `PipelineTimelineStage` (`id`/`name`/`order`/`status`) — mesmo padrão de promoção já usado para `LogViewer` na Phase 8, aplicado agora que o mesmo visual serve tanto ao Deployment Detail quanto ao novo Pipeline Run Detail.
- `pipeline_stages.logs` (coluna já existente desde a Phase 1, mas nunca populada pelo seed) ganhou conteúdo sintético (`stageLogsFor` em `demo-seed.ts`) — sem isso, a aba de logs por stage pedida pela spec ficaria sempre vazia no demo.
- Permission reaproveitada: `deployments:read` (não foi criada uma `pipelines:read` separada) — pipelines são, neste momento, uma reflexão read-only de execuções de deployment já existentes, não uma entidade com ciclo de vida próprio.

## Alternativas consideradas
- **Nova tabela/coluna para representar "pipeline definition" (YAML de CI, por exemplo)**: rejeitado — a spec não pede editar ou definir pipelines, só visualizá-los; o schema atual (nome do pipeline + stages fixas) já é suficiente.
- **Duplicar o componente de timeline em vez de promover**: rejeitado pelo mesmo motivo do `LogViewer` na Phase 8 — duplicar um componente visual idêntico entre duas features viola a convenção do projeto de consolidar após o segundo consumidor real.

## Consequências
- Se uma fase futura precisar disparar pipelines manualmente (re-run) ou definir stages customizadas por serviço, os endpoints atuais (`GET /pipelines`, `GET /pipelines/:id`, `GET /pipelines/runs/:runId`) continuam válidos; só seria necessário adicionar mutações (`POST /pipelines/:id/runs`) seguindo o mesmo padrão de audit log já usado em Deployments e Feature Flags.
