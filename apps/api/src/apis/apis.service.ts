import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import {
  apiConsumers,
  apiEndpoints,
  apiProtocolEnum,
  apiStatusEnum,
  apis,
  documents,
  environments,
  serviceEnvironments,
  services,
  teams,
} from "@nexus/database";
import { and, count, eq, ilike, or } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListApisQuery } from "./dto/list-apis.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

@Injectable()
export class ApisService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
  ) {}

  async list(organizationId: string, query: ListApisQuery) {
    const conditions = [eq(apis.organizationId, organizationId)];
    if (query.search) {
      conditions.push(or(ilike(apis.name, `%${query.search}%`), ilike(apis.slug, `%${query.search}%`))!);
    }
    if (query.protocol && isOneOf(query.protocol, apiProtocolEnum.enumValues)) {
      conditions.push(eq(apis.protocol, query.protocol));
    }
    if (query.status && isOneOf(query.status, apiStatusEnum.enumValues)) {
      conditions.push(eq(apis.status, query.status));
    }
    if (query.team) conditions.push(eq(teams.slug, query.team));

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: apis.id,
          name: apis.name,
          slug: apis.slug,
          version: apis.version,
          status: apis.status,
          protocol: apis.protocol,
          teamName: teams.name,
          serviceName: services.name,
          serviceSlug: services.slug,
        })
        .from(apis)
        .leftJoin(teams, eq(apis.teamId, teams.id))
        .leftJoin(services, eq(apis.serviceId, services.id))
        .where(whereClause)
        .orderBy(apis.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(apis)
        .leftJoin(teams, eq(apis.teamId, teams.id))
        .where(whereClause),
    ]);

    return {
      items,
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getBySlug(organizationId: string, slug: string) {
    const api = await this.db.query.apis.findFirst({
      where: and(eq(apis.organizationId, organizationId), eq(apis.slug, slug)),
    });
    if (!api) {
      throw new NotFoundException("API não encontrada");
    }

    const productionEnvironment = await this.db.query.environments.findFirst({
      where: and(eq(environments.organizationId, organizationId), eq(environments.slug, "production")),
    });

    const [team, service, health, endpoints, consumers, relatedDocuments, activity] = await Promise.all([
      api.teamId ? this.db.query.teams.findFirst({ where: eq(teams.id, api.teamId) }) : Promise.resolve(undefined),
      api.serviceId
        ? this.db.query.services.findFirst({ where: eq(services.id, api.serviceId) })
        : Promise.resolve(undefined),
      api.serviceId && productionEnvironment
        ? this.db.query.serviceEnvironments.findFirst({
            where: and(
              eq(serviceEnvironments.serviceId, api.serviceId),
              eq(serviceEnvironments.environmentId, productionEnvironment.id),
            ),
          })
        : Promise.resolve(undefined),
      this.db
        .select({
          id: apiEndpoints.id,
          method: apiEndpoints.method,
          path: apiEndpoints.path,
          description: apiEndpoints.description,
          requestSchema: apiEndpoints.requestSchema,
          responseSchema: apiEndpoints.responseSchema,
        })
        .from(apiEndpoints)
        .where(eq(apiEndpoints.apiId, api.id)),
      this.db
        .select({
          id: apiConsumers.id,
          name: apiConsumers.name,
          consumerServiceName: services.name,
          consumerServiceSlug: services.slug,
        })
        .from(apiConsumers)
        .leftJoin(services, eq(apiConsumers.consumerServiceId, services.id))
        .where(eq(apiConsumers.apiId, api.id)),
      api.serviceId
        ? this.db
            .select({ id: documents.id, title: documents.title, slug: documents.slug, category: documents.category })
            .from(documents)
            .where(eq(documents.serviceId, api.serviceId))
        : Promise.resolve([]),
      this.auditService.listForResource(organizationId, "api", api.id),
    ]);

    return {
      api,
      team,
      service,
      health: health
        ? {
            status: health.health,
            latencyMs: health.latencyMs,
            errorRate: health.errorRate,
          }
        : null,
      endpoints,
      consumers,
      documents: relatedDocuments,
      activity,
    };
  }
}
