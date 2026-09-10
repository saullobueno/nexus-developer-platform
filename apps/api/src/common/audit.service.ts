import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import { auditLogs } from "@nexus/database";
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
}
