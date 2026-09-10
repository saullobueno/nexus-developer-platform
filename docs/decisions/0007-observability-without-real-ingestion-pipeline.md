# 0007 — Observability lê dados já persistidos, sem pipeline de ingestão real

## Status
Aceita

## Contexto
A spec da Phase 8 descreve Metrics, Logs, Traces e Errors como se fossem alimentados por um pipeline de telemetria real (OpenTelemetry Collector, agregação, retenção). `@nexus/telemetry` existe apenas como scaffold (ver `CLAUDE.md`, "conteúdo real ao longo do projeto") e nenhuma fase anterior implementou ingestão de métricas/logs/traces em runtime — todo o dataset vem do `seedDemoData()` (Phase 3), gravado direto nas tabelas `metrics`, `logs`, `traces`, `trace_spans` e `error_events`.

## Decisão
`ObservabilityService` apenas lê essas tabelas via Drizzle, sempre escopando por `eq(services.organizationId, organizationId)` a partir do usuário autenticado — o mesmo padrão de autorização por objeto já usado em Catalog/Deployments/Incidents. Não há endpoint de ingestão (`POST /observability/*`) nesta fase; isso fica para quando `@nexus/telemetry` ganhar um coletor real, fora do escopo desta fase.

No frontend:
- **Metrics** usa `MetricChart` (`packages/ui`), um wrapper fino de `echarts-for-react` — única lib de gráficos do projeto (`echarts`/`echarts-for-react`, adicionadas com justificativa: a spec pede gráficos de série temporal com zoom, que não existem prontos no design system).
- **Traces** usa `TraceWaterfall`, construído em puro CSS/flexbox (sem lib), pois é apenas um layout proporcional de barras — não justifica dependência adicional.
- **Logs** usa uma sintaxe de busca simples (`level:error service:payments-api trace:abc123`) parseada por `parseLogQuery` (`apps/web/lib/log-query.ts`), sem query language completa (isso ficaria super-dimensionado para o escopo atual).
- `LogViewer` (antes local a Deployments) foi promovido para `packages/ui` porque passou a ter dois consumidores reais (Deployments, Incidents) além do uso em Observability — nenhuma abstração especulativa, só consolidação após duplicação real.
- `/observability` renderiza `MetricsPage` diretamente como landing (sem redirect para `/observability/metrics`), simplificação equivalente à já registrada para `/catalog` e `/deployments`.

## Alternativas consideradas
- **Implementar um coletor OpenTelemetry real agora**: rejeitado — não há nenhum serviço externo emitindo telemetria (Demo Mode via `MockAdapter`), e adicionar um coletor sem produtor real violaria "não instalar dependência sem justificar".
- **Adotar uma lib de query language para logs (ex. parser de Lucene)**: rejeitado — dataset e casos de uso do demo não justificam a complexidade; o parser de pares `chave:valor` cobre os filtros pedidos na spec.

## Consequências
- Quando `@nexus/telemetry` ganhar ingestão real (fora do roadmap de 20 fases explícito, ou revisitado na Phase 15 se o AI Copilot precisar de dados ao vivo), os endpoints de leitura já existentes não mudam — só passam a refletir dados de produção em vez do seed.
- Comparação entre períodos (period-over-period) e um painel de detalhe/drawer para logs individuais ficam como gaps conhecidos, não pedidos explicitamente pela spec para esta fase.
