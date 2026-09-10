# 0013 — Server-Sent Events em vez de WebSocket para Realtime

## Status
Aceita

## Contexto
A spec da Phase 14 (seção 28) pede "WebSocket/SSE para deployment progress, pipeline progress, incidents, service health, logs, notifications e AI runs", com eventos tipados: `deployment.started/updated/completed`, `incident.created/updated/resolved`, `service.health.changed`, `notification.created`, `ai.run.started/tool_called/completed`. A spec já cita SSE como alternativa válida ao WebSocket.

## Decisão
- Implementado via **Server-Sent Events**, usando o decorator `@Sse()` nativo do NestJS (`@nestjs/common`, já uma dependência) sobre um `Observable<MessageEvent>` do RxJS (`rxjs`, já uma dependência transitiva do NestJS) — **zero dependências novas**. A alternativa WebSocket exigiria `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` no backend e `socket.io-client` no frontend, um footprint bem maior para um caso de uso que é só push do servidor para o cliente (nenhum dos eventos da spec exige o cliente enviar mensagens de volta pelo mesmo canal).
- `RealtimeEventBusService` (novo, `apps/api/src/realtime`, módulo `@Global`) é um `Subject<RealtimeEvent>` RxJS in-process. `streamFor(organizationId)` filtra por organização antes de expor ao controller — a mesma autorização por objeto já aplicada em toda query REST do projeto, agora aplicada ao stream. Testado isoladamente (`realtime-event-bus.service.spec.ts`) emitindo para duas organizações e confirmando que o assinante de uma não recebe o evento da outra.
- No frontend, `useRealtimeEvents` abre um `EventSource` nativo do browser (`{ withCredentials: true }`, para enviar o cookie httpOnly `nexus_token` — sem isso o SSE não teria como se autenticar) e, por evento recebido: (1) invalida a query key do TanStack Query correspondente ao prefixo do tipo do evento (`deployment.*` → `["deployments"]`, `incident.*` → `["incidents"]`), fazendo listas/detalhes já abertos atualizarem sozinhos; (2) empilha um toast (`RealtimeToaster`, novo componente `Toast` em `packages/ui`) com uma mensagem formatada (`formatRealtimeMessage`).
- Eventos emitidos nesta fase: apenas os originados de mutações que já existem — `deployment.cancel/retry/rollback` (Phase 6) e `incident.create/update` (Phase 7). `service.health.changed`, `notification.created` e os `ai.run.*` **não são emitidos ainda**, porque não há nenhuma mutação real que os dispare hoje (health é seed estático; Notifications e AI Copilot ainda não existem como features) — emitir esses tipos agora seria simular dados fake, contra a convenção do projeto.
- O hook de frontend faz `if (typeof EventSource === "undefined") return;` antes de conectar — necessário porque o `jsdom` usado pelos testes de componente não implementa `EventSource`; sem esse guard, todo teste que renderiza `<AppShell>` (que agora inclui `<RealtimeToaster>`) quebraria.

## Alternativas consideradas
- **WebSocket (`@nestjs/websockets` + Socket.IO)**: rejeitado por agora — exigiria 3 pacotes novos para um requisito que é puramente unidirecional (servidor → cliente); SSE reconecta automaticamente no navegador (comportamento nativo do `EventSource`) sem código adicional, o que o WebSocket não oferece de graça.
- **Redis Pub/Sub para o event bus**: rejeitado — só se justificaria com múltiplas réplicas do backend rodando ao mesmo tempo, o que não é o caso aqui (sem infraestrutura de deploy multi-instância definida); um `Subject` in-process é suficiente e documentado como limite de escala conhecido.
- **Polling no frontend em vez de push**: rejeitado — a spec pede explicitamente realtime via WebSocket/SSE; polling reintroduziria o atraso e o overhead que a fase existe para eliminar.

## Consequências
- Se o backend rodar com múltiplas réplicas no futuro (ex.: atrás de um load balancer), o `Subject` in-process para de funcionar corretamente (um evento só chega aos clientes conectados àquela réplica específica) — nesse ponto, migrar `RealtimeEventBusService` para Redis Pub/Sub é o caminho natural, sem mudar a interface pública (`emit`/`streamFor`).
- Quando a Phase 15 (AI Copilot) e uma futura feature de Notifications existirem, `ai.run.*` e `notification.created` só precisam de uma chamada a `realtimeEventBus.emit(...)` no ponto certo do código — a infraestrutura de stream/autorização/frontend já está pronta.
