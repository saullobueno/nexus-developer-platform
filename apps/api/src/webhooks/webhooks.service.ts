import { randomBytes } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import { hashPassword } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { webhooks } from "@nexus/database";
import { and, eq } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { CreateWebhookInput } from "./dto/create-webhook.dto";

function toPublicWebhook(row: typeof webhooks.$inferSelect) {
  return { id: row.id, url: row.url, events: row.events, createdAt: row.createdAt };
}

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
  ) {}

  async list(organizationId: string) {
    const rows = await this.db.select().from(webhooks).where(eq(webhooks.organizationId, organizationId));
    return rows.map(toPublicWebhook);
  }

  async create(organizationId: string, actor: AuthenticatedUser, input: CreateWebhookInput) {
    // O segredo em texto puro só existe neste retorno — a partir daqui só o hash
    // (bcrypt, via @nexus/auth) fica persistido, o mesmo padrão usado para senhas.
    const secret = randomBytes(24).toString("hex");
    const secretHash = await hashPassword(secret);

    const [row] = await this.db
      .insert(webhooks)
      .values({ organizationId, url: input.url, events: input.events, secretHash })
      .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "webhook.create",
      resource: "webhook",
      resourceId: row!.id,
      after: toPublicWebhook(row!),
    });

    return { ...toPublicWebhook(row!), secret };
  }

  async remove(organizationId: string, actor: AuthenticatedUser, id: string) {
    const existing = await this.db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId)),
    });
    if (!existing) {
      throw new NotFoundException("Webhook não encontrado");
    }

    await this.db.delete(webhooks).where(eq(webhooks.id, id));

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "webhook.delete",
      resource: "webhook",
      resourceId: id,
      before: toPublicWebhook(existing),
    });

    return { success: true };
  }
}
