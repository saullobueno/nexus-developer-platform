# 0015 — Settings cobre o que tem dado real por trás; Notifications/Security ficam como gaps documentados

## Status
Aceita

## Contexto
A spec (seção 22) lista 8 subseções para Settings: Organization, Members, Roles, Integrations, Environments, Catalog, Notifications, Security, Audit Logs. Das 8, o schema já tinha suporte real para Organization (`organizations.name/timezone/logoUrl`), Members (`users`/`userRoles`), Roles (`roles`/`role_permissions`, já usadas pelo RBAC desde a Phase 2), Environments (`environments.name/slug/type/url`), Integrations (Phase 13) e Audit Logs (`audit_logs`, escrito desde a Phase 6 por `AuditService`, mas nunca exibido em nenhuma UI até agora). "Catalog" (tipos de entidade, metadata obrigatória) e "Security" (SSO, OAuth, 2FA, session timeout, IP restrictions, API keys) e "Notifications" (preferências de canal) não têm nenhuma tabela ou mecanismo real no schema hoje.

## Decisão
- `/settings` ganhou 6 abas: Organization, Members, Roles, Environments, Integrations (já existia), Audit Logs — todas sobre dados/mutações reais.
- **Members**: trocar a role de um membro remove todas as `user_roles` existentes e insere uma nova (modelo de "uma role por usuário", que é como o seed e o RBAC já funcionam na prática, mesmo o schema permitindo N:N). Não há proteção contra remover o último Admin da organização — uma simplificação deliberada e documentada aqui, não um bug esquecido; endurecer isso é trabalho natural da Phase 17 (Security hardening).
- **Roles**: somente leitura — as 5 roles baseline são `isSystem: true` (definidas no seed desde a Phase 2), então não faz sentido oferecer edição de permissions por role nesta fase sem um caso de uso real pedindo isso.
- **Audit Logs**: filtro por `resource`/`action`, paginado, mostra `actorName` via join — a primeira interface que expõe visualmente o audit trail que todas as features desde a Phase 6 já vinham gravando silenciosamente.
- **Catalog, Notifications e Security não ganharam nenhuma tela.** Construir uma UI de "Security: SSO, OAuth, 2FA..." sem nenhum provedor de identidade real por trás seria uma tela decorativa que não faz nada — na contramão da convenção do projeto de nunca simular comportamento (`CLAUDE.md`: "toda feature nova precisa de: comportamento real"). O mesmo vale para "Notifications" como preferências de canal: a tabela `notifications` existe no schema mas nenhuma feature ainda gera notificações in-app/e-mail para o usuário configurar.

## Alternativas consideradas
- **Um formulário de Security com campos desabilitados/"em breve"**: rejeitado — isso é exatamente o tipo de "meio-implementado" que o `CLAUDE.md` pede para evitar ("No half-finished implementations").
- **Permitir editar permissions por role via UI**: rejeitado por agora — nenhuma parte da spec pede customização de roles além das 5 baseline; adicionar isso seria antecipar um requisito não pedido.

## Consequências
- Quando a Phase 17 (Security hardening) tratar rate limiting, security headers e object-level authorization mais a fundo, a proteção "não deixar a organização sem nenhum Admin" é um candidato natural para entrar ali, reaproveitando `SettingsService.updateMemberRole`.
- Se uma fase futura (fora do roadmap de 20 fases) adicionar SSO real (ex. SAML/OIDC) ou um provedor de e-mail para notificações, as abas Security/Notifications passam a ter dado real para mostrar — a estrutura de tabs em `SettingsPage` já está pronta para receber novas abas sem refatoração.
