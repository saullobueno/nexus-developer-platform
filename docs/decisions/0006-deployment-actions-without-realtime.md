# 0006 — Ações de deployment síncronas, sem progressão ao vivo

## Status
Aceita

## Contexto
A spec da Phase 6 pede "emitir eventos realtime" para deployments e um pipeline visual (`Queued → Running → Build → Tests → Security → Deploy → Health check → Success`) progredindo ao vivo. Realtime (WebSocket/SSE) é explicitamente a Phase 14, e BullMQ/Redis só entram quando houver um job real que justifique a fila (`CLAUDE.md`) — nenhum dos dois existe ainda.

## Decisão
Nesta fase, as ações de deployment (cancel/retry/rollback) são **mutações síncronas**: o usuário confirma no dialog, o backend aplica a transição de estado imediatamente (ex.: rollback já nasce com `status: "successful"`, não fica "em progresso") e a UI só dá refetch da lista/detalhe — sem barra de progresso ao vivo nem WebSocket. A timeline de pipeline (`DeploymentTimeline`) mostra o resultado final dos stages já registrados no seed, não uma simulação progredindo em tempo real.

Toda ação mutável grava em `audit_logs` (actor, action, resource, before/after) — primeira feature a usar essa tabela, criada desde a Phase 1.

## Alternativas consideradas
- **Implementar BullMQ agora só para isso**: rejeitado — adicionaria Redis+fila como dependência de infraestrutura sem nenhum outro caso de uso ainda, na contramão da regra "não instalar/depender de infra sem justificar".
- **Simular progressão no frontend com `setTimeout`**: rejeitado — seria um fake sem lastro no backend (o servidor não saberia o estado "real"), contradizendo "toda feature precisa de comportamento real" do Definition of Done.

## Consequências
- Quando a Phase 14 (Realtime) existir, os mesmos endpoints (`POST /deployments/:id/{cancel,retry,rollback}`) devem passar a emitir `deployment.updated`/`deployment.completed` via WebSocket, e o frontend passa a escutar em vez de só invalidar a query após a resposta HTTP.
- Um "deployment simulator" que progride via fila (Phase 11 — Pipelines, ou revisitado na própria Phase 14) pode reaproveitar as mesmas tabelas (`pipeline_runs`, `pipeline_stages`) já populadas pelo demo-seed.
