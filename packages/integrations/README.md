# @nexus/integrations

Interface `IntegrationProvider` (`getRepositories`, `getDeployments`, `getErrors`, `getMetrics`) e `MockAdapter` — a implementação usada em Demo Mode, sem nenhuma chamada de rede, com dados gerados de forma determinística por `repositoryId`.

Os adapters reais (`GitHubAdapter`, `SentryAdapter`, `GrafanaAdapter`, `SlackAdapter`) chegam na Phase 13, implementando a mesma interface — o domínio em `apps/api` nunca chama um vendor diretamente, sempre através de `IntegrationProvider`.
