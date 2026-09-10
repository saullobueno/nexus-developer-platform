# @nexus/auth

Primitivas de autenticação e RBAC para o backend (NestJS), desacopladas de `@nexus/database`: quem consome (`apps/api`) injeta uma implementação concreta de `PermissionsChecker` (token `PERMISSIONS_CHECKER`) que sabe consultar o banco — este pacote não sabe nada sobre Drizzle/Postgres.

## Conteúdo

- `hashPassword` / `verifyPassword` — bcrypt.
- `JwtAuthGuard` — lê o JWT do cookie `nexus_token` (ou `Authorization: Bearer`), popula `request.user`.
- `@RequirePermissions(...)` + `PermissionsGuard` — RBAC: exige que o usuário autenticado tenha todas as permissions informadas.
- `@CurrentUser()` — decorator de parâmetro para extrair o usuário autenticado.
- `assertSameOrganization` — autorização por objeto (object-level authorization): garante que o recurso acessado pertence à mesma organização do usuário.

## O que fica em `apps/api`

Login/logout, emissão do JWT, e a implementação real de `PermissionsChecker` (que consulta `user_roles` → `role_permissions` → `permissions` via `@nexus/database`) vivem em `apps/api/src/auth`, não aqui.
