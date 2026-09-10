# 0003 — Auth (JWT em cookie httpOnly) e RBAC desacoplado do banco

## Status
Aceita

## Contexto
A Phase 2 exige autenticação real, RBAC com as 5 roles da spec e autorização por objeto, aplicadas no backend (`NEXUS-CLAUDE-CODE-PROMPT.md` seção 8). `packages/auth` precisa ser reutilizável por qualquer módulo futuro de `apps/api` sem virar um monólito acoplado ao Drizzle.

## Decisões

### Login por email/senha + JWT em cookie httpOnly
Sem credenciais de SSO real disponíveis (nenhum app OAuth registrado), a Phase 2 implementa login com email/senha (bcrypt) emitindo um JWT (`@nestjs/jwt`) guardado em cookie `nexus_token` (`httpOnly`, `sameSite: lax`, `secure` em produção). SSO/OAuth real fica para a Settings/Security (spec seção 22/25) quando houver um provider configurado — a interface de login não precisa mudar para isso, só a forma de obter o `AuthenticatedUser`.

### `packages/auth` não depende de `packages/database`
`PermissionsGuard` recebe um `PermissionsChecker` (interface) via injeção (token `PERMISSIONS_CHECKER`), em vez de consultar o Drizzle diretamente. Quem implementa a consulta real (`DrizzlePermissionsChecker`, join `user_roles → role_permissions → permissions`) é `apps/api`. Isso mantém `packages/auth` genérico (poderia, no limite, ser reaproveitado com outro ORM) e evita a dependência circular óbvia que apareceria se o seed de usuários demo (em `packages/database`) precisasse importar `packages/auth` para hashear senha — em vez disso, `packages/database` usa `bcryptjs` diretamente (chamada trivial, sem lógica de negócio a duplicar).

### Testes de RBAC e object-level authorization sem Docker
Mesma estratégia da ADR 0002: os testes e2e de `apps/api` (`test/auth.e2e-spec.ts`) sobem um Postgres real via **pglite**, rodam as migrations, semeiam organização/roles/permissions/usuário via as próprias funções de seed de produção (`seedBaseline`, `seedUserWithRole` — não há lógica de teste duplicada) e sobem a aplicação Nest completa com `DATABASE_CLIENT` sobrescrito para esse banco. Cobrem: login inválido, validação de payload (Zod), 401 sem cookie, 200 com cookie, RBAC (permissão concedida) e autorização por objeto (403 ao acessar usuário de outra organização).

Importante: como o teste não passa por `main.ts`, o middleware `cookieParser()` precisa ser registrado manualmente no `app` de teste — só existir em `main.ts` não é suficiente.

## Alternativas consideradas
- **Sessions com store em Redis**: mais correto para revogação imediata de sessão, mas adiciona uma dependência de infraestrutura (Redis) só para login, antes de haver qualquer job/fila real que já justifique tê-lo rodando. JWT com expiração curta (8h) é suficiente para esta fase.
- **`class-validator`/`class-transformer` + `ValidationPipe` nativo do Nest**: descartado a favor de um `ZodValidationPipe` pequeno e reutilizável — evita introduzir uma segunda biblioteca de validação quando Zod já é o padrão do projeto (spec seção 2/25).

## Consequências
- Qualquer módulo novo que precise de autorização usa `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions(...)` de `@nexus/auth`, sem reimplementar nada.
- Novas features com autorização por objeto (ex.: um serviço só editável pelo time dono) devem seguir o padrão de `assertSameOrganization` — comparar o campo de posse do recurso com o usuário autenticado, lançando `ForbiddenException`.
- O catálogo de permissions ainda é o baseline da spec (seção 8); crescerá conforme cada módulo de domínio (Catalog, Deployments, Incidents, ...) definir suas próprias.
