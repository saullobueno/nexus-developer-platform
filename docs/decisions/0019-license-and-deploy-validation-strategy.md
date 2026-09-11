# 0019 — Licença proprietária e validação de Docker/CI deslocada para o pipeline online

## Status
Aceita

## Contexto
Duas decisões pendentes de dono do produto (não técnicas, não deriváveis do código) precisavam ser resolvidas antes de publicar o repositório: (1) que licença usar num repo público de portfólio, e (2) como validar `docker-compose.yml`/Postgres real, já que a máquina de desenvolvimento nunca teve Docker disponível (ver `CLAUDE.md`, nota desde a Phase 0) e o autor optou por não instalar Docker localmente.

## Decisão
- **Licença**: proprietária ("Todos os direitos reservados"), não uma licença open source permissiva (MIT/Apache/etc.). O repositório é público no GitHub para fins de portfólio/avaliação técnica, mas o código não é liberado para reuso, fork comercial ou redistribuição sem autorização do autor. Ver `LICENSE` na raiz; `package.json` usa `"license": "UNLICENSED"` (convenção npm para "não licenciado para publicação/reuso").
- **Validação de Docker/Postgres real**: em vez de rodar `docker compose up -d` localmente, a validação passa a acontecer no pipeline online — o job `build` do GitHub Actions (`.github/workflows/ci.yml`) já roda em Ubuntu com Docker disponível nativamente, e o deploy em produção (Vercel para `apps/web`; a definir para `apps/api`, ver observação abaixo) usa um Postgres gerenciado real, não pglite. A suíte local continua validando schema/queries via `@electric-sql/pglite` (Postgres real em WASM, sem Docker) — isso não muda; o que muda é que "Postgres real, containerizado, subindo via docker-compose" deixa de ser algo que se espera rodar na máquina do autor.

## Observação importante para o deploy em Vercel
`apps/web` (Next.js) é diretamente compatível com Vercel. `apps/api` (NestJS) expõe `GET /realtime/events` via `@Sse()` — uma conexão HTTP de longa duração — que não se encaixa bem no modelo de função serverless da Vercel (timeout de execução por invocação). Rodar `apps/api` na Vercel exigiria adaptar ou aceitar que o realtime não funcione lá; a alternativa mais direta é hospedar `apps/api` num serviço de processo longo (Render, Fly.io, Railway, um VPS) e apontar `NEXT_PUBLIC_API_URL`/`WEB_APP_URL` entre os dois. Essa escolha de onde hospedar `apps/api` fica para quando o deploy for configurado — não foi decidida aqui.

## Alternativas consideradas
- **MIT ou outra licença permissiva**: rejeitada — o autor quer manter os direitos sobre o código mesmo com o repositório público, comum para portfólio que também pode virar produto/consultoria no futuro.
- **Instalar Docker Desktop nesta máquina para validar antes de publicar**: rejeitada por decisão do autor — o ambiente local já demonstrou (Phases 0–19) que pglite cobre a validação de schema/queries; a validação "real" de container/orquestração fica por conta do CI e do provedor de deploy, que já rodam em ambientes com Docker/Postgres gerenciado nativamente.

## Consequências
- `docker-compose.yml` continua no repo como referência para quem quiser rodar localmente com Docker, mas deixa de ser um passo esperado do workflow do autor.
- Primeira execução real do `.github/workflows/ci.yml` acontece só depois do primeiro push — qualquer diferença de ambiente (Node 20 no CI vs. 24 local, instalação do Playwright em Ubuntu) só será conhecida nesse momento, não antes.

## Addendum — a primeira execução do CI falhou, exatamente como previsto acima

O job `test` falhou no `packages/ui` (e teria falhado depois em `apps/web`, que usa a mesma stack de testes) com `TypeError: webidl.util.markAsUncloneable is not a function`, lançado de dentro de `undici@8.10.2` ao ser importado pelo `jsdom@30.0.1` (usado pelo ambiente de teste do Vitest). Causa: `jsdom@^30` depende de uma API interna do Node (`webidl.util.markAsUncloneable`) que não existe no Node 20 — só foi possível reproduzir porque o CI, pela primeira vez, rodou em Node 20 (`NODE_VERSION` do workflow), enquanto todo o desenvolvimento local sempre rodou em Node 24.12, onde a API existe. `pnpm lint` e `pnpm typecheck` passaram normalmente em Node 20 (não dependem de jsdom em runtime); só `test` expôs o problema.

**Correção**: `NODE_VERSION` em `.github/workflows/ci.yml` alterado de `"20"` para `"24"`, e `engines.node` em `package.json` corrigido de `>=20.11.0` (nunca verificado de fato) para `>=24.0.0` (a única versão realmente testada, em CI e localmente, do início ao fim do projeto). Não foi feita nenhuma tentativa de fixar isso "para trás" (ex.: downgrade de `jsdom`) — declarar o requisito real de Node é mais simples e mais honesto do que manter uma dependência mais nova artificialmente compatível com uma versão de Node que nunca foi o alvo real deste projeto.

## Addendum 2 — actions do workflow atualizadas para runtime Node 24

Depois do fix acima, o CI passou a rodar limpo, mas com um aviso do GitHub: `actions/checkout@v4`, `actions/setup-node@v4` e `pnpm/action-setup@v4` declaram internamente `using: node20` nos seus `action.yml` — o runner já forçava execução em Node 24 por trás dos panos, mas avisando que isso vai parar de funcionar quando o Node 20 for desativado nos runners. Verificado via `gh api` que as versões mais recentes de cada uma (`actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`) já declaram `using: node24`, e que os inputs que usamos (`node-version`, `cache: pnpm`, e o uso sem inputs do checkout/pnpm-setup) continuam idênticos — sem breaking change relevante para este workflow. As três foram atualizadas nos 5 jobs do `ci.yml`.
