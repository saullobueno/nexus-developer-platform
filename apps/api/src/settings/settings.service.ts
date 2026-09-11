import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import {
  auditLogs,
  environments,
  organizations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "@nexus/database";
import { and, count, desc, eq } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListAuditLogsQuery } from "./dto/list-audit-logs.dto";
import type { UpdateMemberRoleInput } from "./dto/update-member-role.dto";
import type { UpdateOrganizationInput } from "./dto/update-organization.dto";

@Injectable()
export class SettingsService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
  ) {}

  async getOrganization(organizationId: string) {
    const organization = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    if (!organization) {
      throw new NotFoundException("Organização não encontrada");
    }
    return organization;
  }

  async updateOrganization(organizationId: string, actor: AuthenticatedUser, input: UpdateOrganizationInput) {
    const before = await this.getOrganization(organizationId);

    if (Object.keys(input).length === 0) {
      return before;
    }

    const [updated] = await this.db
      .update(organizations)
      .set(input)
      .where(eq(organizations.id, organizationId))
      .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "organization.update",
      resource: "organization",
      resourceId: organizationId,
      before,
      after: updated,
    });

    return updated;
  }

  async listMembers(organizationId: string) {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
      })
      .from(users)
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.organizationId, organizationId))
      .orderBy(users.name);

    const memberById = new Map<
      string,
      { id: string; name: string; email: string; roles: Array<{ id: string; name: string; slug: string }> }
    >();
    for (const row of rows) {
      const existing = memberById.get(row.id);
      if (existing) {
        if (row.roleId) existing.roles.push({ id: row.roleId, name: row.roleName!, slug: row.roleSlug! });
      } else {
        memberById.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          roles: row.roleId ? [{ id: row.roleId, name: row.roleName!, slug: row.roleSlug! }] : [],
        });
      }
    }

    return Array.from(memberById.values());
  }

  async updateMemberRole(
    organizationId: string,
    actor: AuthenticatedUser,
    userId: string,
    input: UpdateMemberRoleInput,
  ) {
    const member = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.organizationId, organizationId)),
    });
    if (!member) {
      throw new NotFoundException("Membro não encontrado");
    }

    const role = await this.db.query.roles.findFirst({ where: eq(roles.slug, input.roleSlug) });
    if (!role) {
      throw new BadRequestException(`Role "${input.roleSlug}" não encontrada`);
    }

    const before = await this.db
      .select({ roleSlug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    await this.db.delete(userRoles).where(eq(userRoles.userId, userId));
    await this.db.insert(userRoles).values({ userId, roleId: role.id });

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "member.update_role",
      resource: "user",
      resourceId: userId,
      before: { roles: before.map((row) => row.roleSlug) },
      after: { roles: [role.slug] },
    });

    return { id: member.id, name: member.name, email: member.email, roles: [{ id: role.id, name: role.name, slug: role.slug }] };
  }

  async listRoles() {
    const allRoles = await this.db.select().from(roles).orderBy(roles.name);

    const rows = await this.db
      .select({ roleId: rolePermissions.roleId, permissionKey: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    const permissionsByRole = new Map<string, string[]>();
    for (const row of rows) {
      const list = permissionsByRole.get(row.roleId) ?? [];
      list.push(row.permissionKey);
      permissionsByRole.set(row.roleId, list);
    }

    return allRoles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      isSystem: role.isSystem,
      permissions: (permissionsByRole.get(role.id) ?? []).sort(),
    }));
  }

  async listEnvironments(organizationId: string) {
    return this.db
      .select({ id: environments.id, name: environments.name, slug: environments.slug, type: environments.type, url: environments.url })
      .from(environments)
      .where(eq(environments.organizationId, organizationId))
      .orderBy(environments.name);
  }

  async listAuditLogs(organizationId: string, query: ListAuditLogsQuery) {
    const conditions = [eq(auditLogs.organizationId, organizationId)];
    if (query.resource) conditions.push(eq(auditLogs.resource, query.resource));
    if (query.action) conditions.push(eq(auditLogs.action, query.action));
    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resource: auditLogs.resource,
          resourceId: auditLogs.resourceId,
          before: auditLogs.before,
          after: auditLogs.after,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(auditLogs).where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }
}
