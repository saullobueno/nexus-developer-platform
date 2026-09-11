# 0017 — Performance e Accessibility: debounce, optimistic update e navegação por teclado

## Status
Aceita

## Contexto
A spec (seções 31 e 32) pede, em Performance: "SSR/streaming quando apropriado, pagination, virtualization, caching, query optimization, debounce e optimistic updates"; em Accessibility: "keyboard navigation, focus management, semantic HTML, ARIA, contrast, reduced motion e acessibilidade de dialogs/tables". Boa parte já estava resolvida organicamente ao longo do projeto: paginação real em todo endpoint de listagem desde a Phase 5+ (`page`/`pageSize` no backend, nunca carregar tudo de uma vez), e os componentes de overlay (`Dialog`, `Tabs`, `Switch`) são construídos sobre primitivas Radix UI, que já entregam focus trap, fechamento por Escape, navegação por setas e roles ARIA corretos sem nenhum código adicional — não havia lacuna aí para fechar.

O que faltava, encontrado ao auditar as páginas com busca/filtro (8 no total: Catalog, Teams, Audit Logs, Observability Logs, Pipelines, Feature Flags, Docs, APIs): todas disparavam uma nova requisição a cada tecla digitada, sem debounce. E no AppShell: não havia skip-link, o item ativo da sidebar não tinha `aria-current`, e quando a sidebar está colapsada o nome acessível do link dependia só do atributo `title` (não confiável em todos os leitores de tela).

## Decisão
- **Debounce**: hook `useDebouncedValue` (`apps/web/hooks/use-debounced-value.ts`, testado com fake timers) aplicado às 8 telas de busca/filtro citadas acima — o campo de texto continua respondendo a cada tecla (`value`/`onChange` imediatos), mas a query só dispara 300ms depois da última tecla digitada.
- **Optimistic update**: `FlagToggle` (o switch de enable/disable de feature flags, usado tanto na listagem quanto no detail) agora atualiza o cache do TanStack Query imediatamente em `onMutate` (via `setQueriesData` com prefixo `["feature-flags"]`, que cobre tanto a lista paginada quanto o detail), reverte em `onError` a partir do snapshot salvo, e reconcilia com o servidor em `onSettled`. Escolhido este mutation especificamente por ser o candidato mais natural a um toggle instantâneo — estender o mesmo padrão a toda mutação da aplicação seria escopo desproporcional para esta fase.
- **Accessibility no AppShell**: skip-link ("Pular para o conteúdo", visível só no focus) apontando para `#main-content`; `<main id="main-content" tabIndex={-1}>` como alvo do skip-link; sidebar com `<nav aria-label="Navegação principal">`, `aria-current="page"` no item ativo, e `aria-label={item.label}` explícito em todo link (em vez de depender só de `title`, que não é garantidamente exposto por toda tecnologia assistiva) — o `title` continua presente apenas como tooltip visual quando colapsada.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` em `packages/ui/src/styles/globals.css` zera durações de transição/animação e `scroll-behavior` para quem configurou essa preferência no SO/navegador.
- **Virtualization**: não adotada — toda lista renderizada no cliente já vem paginada pelo backend (20-50 itens por página), então não há lista longa o suficiente para justificar uma dependência nova (`react-window`/`@tanstack/react-virtual`) sem violar a regra de "não instalar dependência sem justificar".

## Alternativas consideradas
- **SSR/streaming real nas páginas do app**: rejeitada por ora. Toda página do `apps/web` segue o padrão estabelecido desde a Phase 4 — `AuthGuard` client-side chamando `GET /auth/me`, com cada página buscando seus próprios dados via TanStack Query depois de montada (ver limitação já documentada em `CLAUDE.md`). Migrar para streaming SSR exigiria repensar autenticação (mover a checagem para o servidor) em ~20 rotas simultaneamente — um retrofit arquitetural grande demais para uma fase de hardening, e arriscado a essa altura do projeto. Fica documentado como gap conhecido, não como omissão.
- **Optimistic update em todas as mutações (member role, incident update, integration upsert etc.)**: rejeitada — cada uma tem formatos de cache e efeitos colaterais (audit log, realtime events) diferentes; fazer isso com qualidade em todas exigiria uma auditoria própria maior que o escopo desta fase. `FlagToggle` serve como o exemplo de referência do padrão, documentado aqui para reaproveitar se uma fase futura quiser estender.
- **Auditoria manual de contraste de cor**: não realizada — a paleta vem inalterada do preset padrão do shadcn/ui (`oklch`, já pensado para atender AA), e o projeto não tem ferramenta de auditoria visual automatizada; confiamos no design system em vez de inspecionar par a par.

## Consequências
- As 8 páginas de busca agora fazem uma requisição por pausa de digitação em vez de uma por tecla — reduz carga no backend proporcionalmente ao tamanho médio do termo buscado.
- `FlagToggle` é o único ponto do app com optimistic update; se uma fase futura quiser generalizar o padrão, `flipCachedFlag` em `flag-toggle.tsx` é o exemplo a seguir.
- Autenticação client-side (gap de SSR) continua sendo uma limitação arquitetural conhecida, agora reforçada aqui em vez de deixada implícita apenas no `CLAUDE.md`.
