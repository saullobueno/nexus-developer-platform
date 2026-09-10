import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { integrationProviderEnum, integrations } from "@nexus/database";
import { MockAdapter, resolveAdapter, type SupportedProvider } from "@nexus/integrations";
import { and, eq } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { UpsertIntegrationInput } from "./dto/upsert-integration.dto";

const SECRET_KEY_PATTERN = /token|key|secret|password/i;

function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      SECRET_KEY_PATTERN.test(key) && typeof value === "string" && value.length > 0 ? "••••••••" : value,
    ]),
  );
}

function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

@Injectable()
export class IntegrationsService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
  ) {}

  private assertValidProvider(provider: string): asserts provider is SupportedProvider {
    if (!integrationProviderEnum.enumValues.includes(provider as (typeof integrationProviderEnum.enumValues)[number])) {
      throw new BadRequestException(`Provider "${provider}" desconhecido`);
    }
  }

  async list(organizationId: string) {
    const rows = await this.db.select().from(integrations).where(eq(integrations.organizationId, organizationId));
    const rowByProvider = new Map(rows.map((row) => [row.provider, row]));

    return integrationProviderEnum.enumValues
      .filter((provider) => provider !== "mock")
      .map((provider) => {
        const row = rowByProvider.get(provider);
        return {
          provider,
          configured: !!row && Object.keys(row.config as Record<string, unknown>).length > 0,
          enabled: row?.enabled ?? false,
          config: row ? maskConfig(row.config as Record<string, unknown>) : {},
        };
      });
  }

  async upsert(organizationId: string, actor: AuthenticatedUser, provider: string, input: UpsertIntegrationInput) {
    this.assertValidProvider(provider);

    const existing = await this.db.query.integrations.findFirst({
      where: and(eq(integrations.organizationId, organizationId), eq(integrations.provider, provider)),
    });

    const [row] = existing
      ? await this.db
          .update(integrations)
          .set({ config: input.config, enabled: input.enabled })
          .where(eq(integrations.id, existing.id))
          .returning()
      : await this.db
          .insert(integrations)
          .values({ organizationId, provider, config: input.config, enabled: input.enabled })
          .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "integration.configure",
      resource: "integration",
      resourceId: row!.id,
      before: existing ? { enabled: existing.enabled, config: maskConfig(existing.config as Record<string, unknown>) } : null,
      after: { enabled: row!.enabled, config: maskConfig(row!.config as Record<string, unknown>) },
    });

    return {
      provider: row!.provider,
      configured: Object.keys(row!.config as Record<string, unknown>).length > 0,
      enabled: row!.enabled,
      config: maskConfig(row!.config as Record<string, unknown>),
    };
  }

  async testConnection(organizationId: string, provider: string) {
    this.assertValidProvider(provider);

    const existing = await this.db.query.integrations.findFirst({
      where: and(eq(integrations.organizationId, organizationId), eq(integrations.provider, provider)),
    });

    const demoMode = isDemoMode();
    const adapter = resolveAdapter({
      provider,
      config: (existing?.config as Record<string, unknown>) ?? {},
      demoMode,
    });

    try {
      const repositories = await adapter.getRepositories();
      return { ok: true, usingMock: demoMode || adapter instanceof MockAdapter, repositoryCount: repositories.length };
    } catch (error) {
      return {
        ok: false,
        usingMock: demoMode || adapter instanceof MockAdapter,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}
