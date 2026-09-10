# 0011 — Reports calcula DORA/Reliability/Delivery a partir do schema existente, com proxies documentados

## Status
Aceita

## Contexto
A spec da Phase 12 pede Team KPIs (services, deployments, incidents, uptime, MTTR, deployment frequency) e Reports com três seções: DORA (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR), Reliability (SLO, SLA, uptime, error budget) e Delivery (deployments, failed deployments, rollback rate, pipeline duration). Nenhuma dessas métricas tem uma tabela dedicada — todas precisam ser derivadas de `deployments`, `incidents`, `service_environments` e `pipeline_runs`/`pipeline_stages`, que não foram desenhados pensando em métricas agregadas (não há timestamp de commit separado do deployment, nem uma tabela de SLO/error-budget com metas configuráveis).

## Decisão
- **Lead Time for Changes**: aproximado pela duração média do deployment (`deployments.durationMs`), não pelo clássico "tempo do commit até produção" — o schema não tem um timestamp de commit distinto de `deployments.createdAt`/`startedAt`. Documentado explicitamente na UI (`helpText` do `MetricCard`) e no código (`ReportsService.get`), não escondido como se fosse a métrica exata.
- **Uptime / Error Budget**: `uptime = 100 - média(service_environments.error_rate)` das produções da organização; `error_budget_remaining = uptime - target` com `target` fixo em `99.9`. Não existe uma tabela de SLO configurável por serviço — usar uma constante é uma simplificação assumida, não uma feature de configuração de SLO (isso ficaria para uma fase de Settings dedicada, se o produto crescer nessa direção).
- **MTTR**: `avg(incidents.resolvedAt - incidents.detectedAt)` para incidentes com `status = "resolved"`, calculado tanto no Team Detail (escopado aos serviços do time) quanto em Reports (org-wide). Sem janela de tempo (usa todos os incidentes resolvidos) porque o dataset de demo é pequeno — limitar a 30 dias frequentemente zeraria a métrica.
- **Change Failure Rate / Rollback Rate**: proporção de deployments com status `failed`/`rolled_back` sobre o total no período (`days`, default 30).
- Todos os agregados são computados em **JavaScript após buscar as linhas** (não via `AVG()`/`SUM()` SQL) — dado o volume pequeno do dataset de demo, isso evita depender de sintaxe de agregação do Drizzle 0.45 ainda não usada em nenhum outro lugar do código (mesma cautela já registrada nas ADRs anteriores diante de APIs desconhecidas, ex. TanStack Table).
- Novas permissions `teams:read` e `reports:read` (concedidas a todas as roles baseline, mesmo padrão de `apis:read`/`docs:read`/`feature_flags:read`) — em vez de reaproveitar `services:read` como foi feito para Pipelines (ADR 0010), porque Teams e Reports são seções de navegação de primeira classe com identidade própria na spec, não uma reflexão de uma permission já existente.

## Alternativas consideradas
- **Tabela `slo_targets` por serviço**: rejeitado por agora — a spec não pede configuração de SLO, só a exibição de "SLO, SLA, uptime, error budget"; uma constante org-wide é suficiente para satisfazer o requisito sem inventar uma feature de configuração não pedida.
- **Agregação via SQL (`AVG`, `GROUP BY`)**: rejeitado pelo mesmo motivo do ADR sobre TanStack Table — preferir uma abordagem simples e verificável (reduce em JS) a uma API do Drizzle ainda não usada no projeto, dado o volume de dados pequeno do demo.

## Consequências
- Se o dataset de demo crescer (mais organizações, mais deployments), os agregados em JS deixam de escalar bem — nesse ponto, migrar para agregação SQL nativa do Postgres seria a evolução natural.
- Se uma fase futura (Settings) adicionar SLO configurável por serviço, `ReportsService`/`TeamsService` precisam trocar a constante `TARGET_UPTIME` por uma leitura de configuração, mas a fórmula de uptime/error-budget não muda.
