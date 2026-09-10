# 0004 — Demo Mode: MockAdapter único e dataset de demonstração via seed

## Status
Aceita

## Contexto
O Nexus precisa ser demonstrável sem nenhuma credencial externa (GitHub, Sentry, Grafana, Slack) e sem depender de features de produto que ainda não existem (Catalog, Deployments, Incidents chegam nas Phases 5–8). A Phase 3 precisa entregar isso de forma que já seja útil agora e continue útil conforme as próximas fases forem lendo os mesmos dados.

## Decisões

### Um único `MockAdapter`, não quatro
A spec (seção 19/26) desenha a arquitetura de integrações como `IntegrationProvider` com adapters `GitHubAdapter`, `SentryAdapter`, `GrafanaAdapter`, `SlackAdapter` e **um** `MockAdapter` — não um mock por vendor. Implementamos exatamente isso: `MockAdapter` (`packages/integrations`) implementa a interface inteira (`getRepositories`, `getDeployments`, `getErrors`, `getMetrics`) com dados gerados deterministicamente a partir do `repositoryId` (mesmo id → mesmo resultado, exceto timestamps). Os adapters reais por vendor chegam na Phase 13, implementando a mesma interface.

### Dataset de demonstração vive no banco, não em mocks de API
Em vez de simular dados "on the fly" a cada request (o que exigiria endpoints/features que ainda não existem), o Demo Mode desta fase é um **gerador de seed** (`packages/database` `seedDemoData`) que insere dados realistas diretamente no Postgres: os 6 times e 8 services da spec (seção 27), deployments com pipelines/stages, incidentes com timeline, métricas/logs/traces/spans/error events, APIs, documentação, ADR e feature flags. Quando as Phases 4–11 implementarem os endpoints de produto, eles já vão encontrar dados reais para exibir — não precisam de um caminho de código "modo demo" separado do caminho real, só um banco populado.

### Não é idempotente para tabelas sem chave natural
`seedBaseline` e `seedUserWithRole` (Phase 1/2) são idempotentes (`onConflictDoNothing` em colunas únicas). `seedDemoData` reaproveita essas duas para organização/roles/usuários, mas as tabelas puramente geradas (deployments, métricas, logs, traces, incident events, ...) não têm uma chave de negócio natural para deduplicar — rodar `db:seed:demo` duas vezes cria dados duplicados. Isso é aceitável e documentado (`packages/database/README.md`): o comando é pensado para rodar uma vez contra um banco limpo, não como operação repetível em produção.

## Alternativas consideradas
- **Mock adapter por vendor (`MockGitHubAdapter`, `MockSentryAdapter`, ...)**: mais granular, mas contradiz a arquitetura explícita da spec e adicionaria 4 classes quase idênticas sem necessidade real nesta fase.
- **Gerar dados em memória a cada request (sem persistir)**: mais parecido com "mock" tradicional, mas inviável agora porque as features que consumiriam esses dados (Catalog, Deployments, Observability) ainda não existem — não haveria onde plugar o gerador. Persistir no banco resolve o problema sem acoplar Demo Mode a features futuras.

## Consequências
- Quando a Phase 13 implementar os adapters reais, a decisão de qual usar (`MockAdapter` vs. real) passa a depender de `DEMO_MODE`/configuração de integração — hoje não há essa ramificação porque só existe uma implementação.
- Novas entidades de domínio adicionadas em fases futuras devem, quando fizer sentido, ganhar uma extensão em `seedDemoData` para continuarem aparecendo no dataset de demonstração.
