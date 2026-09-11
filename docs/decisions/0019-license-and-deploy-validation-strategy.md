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
