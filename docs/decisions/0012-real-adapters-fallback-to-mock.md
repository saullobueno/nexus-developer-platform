# 0012 — Adapters reais implementam a interface do MockAdapter, com fallback automático

## Status
Aceita

## Contexto
A spec da Phase 13 (seção 26, "Integration Architecture") pede adapters reais — `GitHubAdapter`, `SentryAdapter`, `GrafanaAdapter`, `SlackAdapter` — implementando a mesma `IntegrationProvider` (`getRepositories`, `getDeployments`, `getErrors`, `getMetrics`) já usada pelo `MockAdapter` desde a Phase 3. A seção 27 (Demo Mode) exige que `DEMO_MODE=true` funcione sem nenhuma credencial externa. `apps/api` nunca havia importado `@nexus/integrations` até agora — os dados do demo sempre vieram direto do Postgres via `demo-seed.ts`.

## Decisão
- Cada adapter real (`GitHubAdapter`, `SentryAdapter`, `GrafanaAdapter`) faz chamadas HTTP reais via `fetch` nativo do Node (sem cliente HTTP adicional) contra a API pública de cada vendor, usando a forma de autenticação real de cada um (Bearer token). Onde o domínio do vendor não mapeia 1:1 para `repositórios`/`deployments`/`errors`/`metrics` (ex.: Grafana não tem "repositórios"; GitHub não tem "métricas de runtime"), o método correspondente retorna `[]` com um comentário explicando a limitação — em vez de inventar dados para preencher a interface.
- `SlackAdapter` é o único que não mapeia genuinamente para nenhum dos 4 métodos (Slack é canal de notificação, não fonte de dados) — os 4 retornam `[]` por design, e a capacidade real (`sendNotification`, via `chat.postMessage`) é exposta como método adicional fora da interface `IntegrationProvider`, para uso pela Phase 14 (Realtime)/Phase 16 (Settings → Notifications).
- `resolveAdapter(provider, config, demoMode)` centraliza a escolha: retorna `MockAdapter` sempre que `demoMode` é `true` OU o `config` obrigatório do provider está incompleto — nunca lança erro por falta de credencial, sempre degrada para dados de demo (spec seção 27).
- `IntegrationsService` (novo, `apps/api/src/integrations`) persiste config por provider na tabela `integrations` (já existente desde a Phase 1, ganhou um índice único `organizationId+provider` nesta fase) e expõe `GET /integrations` (config mascarado — chaves como `token`/`apiKey`/`secret` viram `••••••••` na resposta e no audit log), `PUT /integrations/:provider` (upsert, audit logado) e `POST /integrations/:provider/test` (chama `getRepositories()` do adapter resolvido e reporta sucesso/falha, incluindo se caiu para mock).
- Permissions reaproveitadas: `settings:read`/`settings:update` (já existentes desde a Phase 2) — Integrations é uma subseção de Settings na spec (seção 22), não um destino de navegação próprio; por isso não ganhou uma permission dedicada como Teams/Reports (ADR 0011) ganharam.
- Frontend: `/settings` (rota nova, nav item "Settings" já existia apontando para lá desde o Phase 0 scaffold) mostra só a seção Integrations por ora — Organization/Members/Roles/Environments/Notifications/Security/Audit Logs (demais subseções da spec 22) ficam para a Phase 16 (Settings/Audit).

## Alternativas consideradas
- **Testar os adapters reais contra APIs de vendors ao vivo**: impossível neste ambiente (sem credenciais reais nem acesso de rede garantido) — os testes unitários mockam `fetch` global com respostas no formato real documentado de cada API (GitHub REST, Sentry API, Prometheus query API via proxy do Grafana), validando o parsing sem depender de rede.
- **Um `PrometheusAdapter` dedicado**: rejeitado — o diagrama da spec (seção 26) não lista uma classe própria para Prometheus, e `GrafanaAdapter` já cobre consultas PromQL via o proxy de datasource do Grafana, que é o caminho mais comum de acesso a Prometheus num IDP real.
- **Guardar `Integrations` como destino de navegação de primeiro nível**: rejeitado — a spec agrupa Integrations dentro de Settings; manter a mesma estrutura evita ter que mover a feature de lugar quando a Phase 16 construir o shell completo de Settings.

## Consequências
- `config` fica em `jsonb` sem criptografia em repouso — um gap de segurança conhecido e documentado, a ser tratado na Phase 17 (Security hardening) junto com os demais itens da spec seção 29 (secure secret handling).
- Quando a Phase 14 (Realtime) ou 16 (Notifications) precisar enviar notificações Slack de verdade, `SlackAdapter.sendNotification` já existe e só falta ser conectado ao evento (`deployment.failed`, `incident.created` etc.) descrito na spec seção 21.
