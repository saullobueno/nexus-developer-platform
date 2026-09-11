# AGENTS.md

Instruções para agentes de codificação trabalhando neste repositório (equivalente a `CLAUDE.md`, que tem mais contexto de produto — leia os dois).

## Setup

```bash
pnpm install
```

Requer pnpm (`packageManager` no `package.json` raiz fixa a versão). Node >= 24 (`jsdom@30` usa uma API interna do Node que não existe em versões mais antigas — ver `docs/decisions/0019-license-and-deploy-validation-strategy.md`, addendum).

## Comandos de verificação (rodar antes de considerar uma mudança pronta)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para escopo único: `pnpm --filter <nome-do-pacote> <script>` (nomes em cada `package.json`: `web`, `api`, `docs`, `@nexus/ui`, `@nexus/database`, etc.).

E2E (Playwright, sobe `apps/web` automaticamente): `pnpm test:e2e`.

## Estrutura

Monorepo pnpm + Turborepo: `apps/{web,api,docs}`, `packages/{ui,database,auth,ai,integrations,telemetry,config,types}`, `tests/` (e2e), `docs/` (architecture, decisions, product, api, ai). Detalhes e propósito de cada pacote em `CLAUDE.md`.

## Estilo de código

- TypeScript strict, sem `any`. Zod para validar fronteiras (env, input externo).
- Componentes React pequenos e focados; regra de negócio no domínio/service layer, não em controllers.
- Autorização sempre no backend; nunca confiar em IDs vindos do frontend sem checar no backend.
- Sem comentários explicando o óbvio; só quando há uma razão não-óbvia (workaround, invariante escondida).

## Limites

- Não instalar dependência sem justificar (verificar se a stack atual já resolve).
- Não implementar múltiplas fases do roadmap de uma vez — uma fase por vez, com plano apresentado antes de mudanças não triviais.
- Não commitar/dar push sem pedido explícito do usuário.
- Não desabilitar TypeScript, remover testes para o build passar, nem usar `eslint-disable` indiscriminadamente.
- Ações mutáveis de IA (rollback, criar incidente, mudar feature flag, disparar deployment) exigem aprovação humana explícita — nunca executar silenciosamente.
