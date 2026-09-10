import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { featureFlagRules, featureFlagTypeEnum, featureFlags } from "@nexus/database";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListFeatureFlagsQuery } from "./dto/list-feature-flags.dto";
import type { UpdateRulesInput } from "./dto/update-rules.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

@Injectable()
export class FeatureFlagsService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
  ) {}

  async list(organizationId: string, query: ListFeatureFlagsQuery) {
    const conditions = [eq(featureFlags.organizationId, organizationId)];
    if (query.search) {
      conditions.push(ilike(featureFlags.name, `%${query.search}%`));
    }
    if (query.type && isOneOf(query.type, featureFlagTypeEnum.enumValues)) {
      conditions.push(eq(featureFlags.type, query.type));
    }

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: featureFlags.id,
          key: featureFlags.key,
          name: featureFlags.name,
          description: featureFlags.description,
          type: featureFlags.type,
          enabled: featureFlags.enabled,
          updatedAt: featureFlags.updatedAt,
        })
        .from(featureFlags)
        .where(whereClause)
        .orderBy(featureFlags.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(featureFlags).where(whereClause),
    ]);

    return {
      items,
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  private async findByKeyOrThrow(organizationId: string, key: string) {
    const flag = await this.db.query.featureFlags.findFirst({
      where: and(eq(featureFlags.organizationId, organizationId), eq(featureFlags.key, key)),
    });
    if (!flag) {
      throw new NotFoundException("Feature flag não encontrada");
    }
    return flag;
  }

  async getByKey(organizationId: string, key: string) {
    const flag = await this.findByKeyOrThrow(organizationId, key);

    const [rules, activity] = await Promise.all([
      this.db
        .select({ id: featureFlagRules.id, kind: featureFlagRules.kind, value: featureFlagRules.value, order: featureFlagRules.order })
        .from(featureFlagRules)
        .where(eq(featureFlagRules.featureFlagId, flag.id))
        .orderBy(asc(featureFlagRules.order)),
      this.auditService.listForResource(organizationId, "feature_flag", flag.id),
    ]);

    return { flag, rules, activity };
  }

  async toggle(organizationId: string, key: string, actor: AuthenticatedUser) {
    const flag = await this.findByKeyOrThrow(organizationId, key);
    const nextEnabled = !flag.enabled;

    const [updated] = await this.db
      .update(featureFlags)
      .set({ enabled: nextEnabled })
      .where(eq(featureFlags.id, flag.id))
      .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: nextEnabled ? "feature_flag.enable" : "feature_flag.disable",
      resource: "feature_flag",
      resourceId: flag.id,
      before: { enabled: flag.enabled },
      after: { enabled: nextEnabled },
    });

    return updated;
  }

  async updateRules(organizationId: string, key: string, actor: AuthenticatedUser, input: UpdateRulesInput) {
    const flag = await this.findByKeyOrThrow(organizationId, key);

    const previousRules = await this.db
      .select({ kind: featureFlagRules.kind, value: featureFlagRules.value, order: featureFlagRules.order })
      .from(featureFlagRules)
      .where(eq(featureFlagRules.featureFlagId, flag.id))
      .orderBy(asc(featureFlagRules.order));

    await this.db.delete(featureFlagRules).where(eq(featureFlagRules.featureFlagId, flag.id));

    if (input.rules.length > 0) {
      await this.db.insert(featureFlagRules).values(
        input.rules.map((rule, index) => ({
          featureFlagId: flag.id,
          kind: rule.kind,
          value: rule.value,
          order: index,
        })),
      );
    }

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "feature_flag.update_rules",
      resource: "feature_flag",
      resourceId: flag.id,
      before: previousRules,
      after: input.rules,
    });

    return this.getByKey(organizationId, key);
  }
}
