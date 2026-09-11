# 0018 — Final QA: corrigir drift entre documentação aspiracional da Phase 0 e o que foi de fato construído

## Status
Aceita

## Contexto
A Phase 0 provisionou stack e documentação para o projeto inteiro *antes* de qualquer feature existir, incluindo peças que só fariam sentido "quando houver jobs/filas reais" (`CLAUDE.md`, textualmente). Ao chegar na Phase 19 (Documentation/Final QA) e revisar o repositório de ponta a ponta, duas dessas peças nunca foram usadas em nenhuma das 18 fases anteriores, mas continuavam presentes em `docker-compose.yml`, `.env.example` e na narrativa do README/ARCHITECTURE.md como se fizessem parte do sistema em funcionamento:

1. **Redis + BullMQ**: `docker-compose.yml` subia um container Redis, e `REDIS_URL` existia em dois `.env.example`, mas nenhum `package.json` do monorepo jamais instalou `redis`, `ioredis` ou `bullmq`, e nenhum código lê `process.env.REDIS_URL`. O realtime (Phase 14) foi resolvido inteiramente com SSE + RxJS in-process (ADR 0013), exatamente para não precisar de um broker.
2. **`@nexus/telemetry`**: permanece como o scaffold vazio (`export type Placeholder = never`) criado na Phase 0. Nenhuma fase instrumentou `apps/api`/`apps/web` com OpenTelemetry real. Isso é diferente da feature de produto "Observability" (Phase 8), que exibe logs/métricas/traces de *serviços do catálogo* — essa é real e testada; o que não existe é o Nexus instrumentando a si mesmo.

Documentação que descreve infraestrutura inexistente como se existisse é pior do que não ter documentação — é exatamente o tipo de coisa que uma passagem de Final QA deve pegar antes de chamar o projeto de pronto.

## Decisão
- Removido o serviço `redis` (e seu volume) de `docker-compose.yml` — só resta `postgres`, que é o único serviço de fato usado por qualquer comando do projeto.
- Removida a variável `REDIS_URL` de `.env.example` e `apps/api/.env.example`.
- `README.md` (seção Stack) e `ARCHITECTURE.md` (diagrama C4 e seção Realtime) atualizados para descrever o que roda de fato: Postgres via Drizzle, SSE in-process, sem Redis/BullMQ/WebSocket.
- `packages/telemetry/README.md` reescrito para declarar honestamente que o pacote nunca saiu do scaffold, com o racional (nenhum caso de uso concreto justificou a dependência) em vez de manter a redação "incremental" original, que sugeria progresso que não aconteceu.
- `ARCHITECTURE.md` ganhou uma seção nova distinguindo explicitamente "Observability (produto)" de "telemetria do próprio Nexus", para que um leitor não confunda as duas.

## Alternativas consideradas
- **Implementar OpenTelemetry real agora, para "fechar" a Phase 19 com 100% do escopo aspiracional da Phase 0**: rejeitada. Instrumentar de verdade (setup de SDK, exporter, correlação de trace ID entre `apps/web`/`apps/api`/Postgres) é um trabalho de feature completo, não uma correção de documentação — arriscado a esta altura do projeto e fora do que Final QA deveria fazer. Documentar honestamente o gap é consistente com o padrão já estabelecido nas ADRs 0015 e 0016 (nunca construir tela/infra decorativa; documentar o que falta em vez de fingir).
- **Manter Redis no `docker-compose.yml` "para o futuro"**: rejeitada — um serviço que nada usa e que ninguém precisa rodar hoje é ruído operacional (mais um container para subir, mais uma healthcheck para falhar) sem benefício presente.

## Consequências
- `pnpm dev`/`docker compose up -d` ficam mais simples e honestos: só o que é realmente necessário.
- Se uma fase futura (fora do roadmap de 20 fases) introduzir um job real (ex.: processamento assíncrono de webhooks outbound, mencionado como gap na ADR 0016), Redis/BullMQ voltam a ser candidatos naturais — a decisão de não tê-los hoje não é permanente, só reflete o que existe agora.

## Addendum — vulnerabilidade em dependência transitiva (`multer`)

Uma segunda passagem de QA rodou `pnpm audit --prod` e encontrou 4 advisories (3 high, 1 low) em `multer@2.2.0`, trazido transitivamente por `@nestjs/platform-express` (usado por `apps/api` e `@nexus/auth`, nenhum dos dois expõe upload de arquivo). Como não usamos a funcionalidade do multer, subir a versão não tem risco funcional — adicionado um override em `pnpm-workspace.yaml` (`overrides: { multer: ^2.3.0 }`), a versão publicada que corrige todos os 4 advisories. `pnpm audit --prod` volta limpo depois do `pnpm install`.
