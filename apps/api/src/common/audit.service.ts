import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import { auditLogs, users } from "@nexus/database";
import { and, desc, eq } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";

export interface RecordAuditParams {
  organizationId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async record(params: RecordAuditParams): Promise<void> {
    await this.db.insert(auditLogs).values({
      organizationId: params.organizationId,
      actorId: params.actorId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      before: params.before ?? null,
      after: params.after ?? null,
    });
  }

  async listForResource(organizationId: string, resource: string, resourceId: string, limit = 20) {
    return this.db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
        actorName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(
        and(
          eq(auditLogs.organizationId, organizationId),
          eq(auditLogs.resource, resource),
          eq(auditLogs.resourceId, resourceId),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}
