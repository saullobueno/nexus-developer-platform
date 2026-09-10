import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import {
  apis,
  deployments,
  environments,
  healthStatusEnum,
  incidentServices,
  incidents,
  lifecycleEnum,
  metrics,
  serviceDependencies,
  serviceEnvironments,
  serviceOwners,
  serviceTypeEnum,
  services,
  teams,
  users,
} from "@nexus/database";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListServicesQuery } from "./dto/list-services.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

@Injectable()
export class ServicesService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async list(organizationId: string, query: ListServicesQuery) {
    const productionEnvironment = await this.db.query.environments.findFirst({
      where: and(eq(environments.organizationId, organizationId), eq(environments.slug, "production")),
    });

    const conditions = [eq(services.organizationId, organizationId)];
    if (query.search) {
      conditions.push(
        or(ilike(services.name, `%${query.search}%`), ilike(services.slug, `%${query.search}%`))!,
      );
    }
    if (query.team) conditions.push(eq(teams.slug, query.team));
    if (query.type && isOneOf(query.type, serviceTypeEnum.enumValues)) {
      conditions.push(eq(services.type, query.type));
    }
    if (query.lifecycle && isOneOf(query.lifecycle, lifecycleEnum.enumValues)) {
      conditions.push(eq(services.lifecycle, query.lifecycle));
    }
    if (query.health && productionEnvironment && isOneOf(query.health, healthStatusEnum.enumValues)) {
      conditions.push(eq(serviceEnvironments.health, query.health));
    }

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: services.id,
          name: services.name,
          slug: services.slug,
          type: services.type,
          lifecycle: services.lifecycle,
          language: services.language,
          framework: services.framework,
          teamName: teams.name,
          health: serviceEnvironments.health,
          version: serviceEnvironments.version,
          lastDeployedAt: serviceEnvironments.lastDeployedAt,
        })
        .from(services)
        .leftJoin(teams, eq(services.teamId, teams.id))
        .leftJoin(
          serviceEnvironments,
          and(
            eq(serviceEnvironments.serviceId, services.id),
            productionEnvironment
              ? eq(serviceEnvironments.environmentId, productionEnvironment.id)
              : undefined,
          ),
        )
        .where(whereClause)
        .orderBy(services.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(services)
        .leftJoin(teams, eq(services.teamId, teams.id))
        .leftJoin(
          serviceEnvironments,
          and(
            eq(serviceEnvironments.serviceId, services.id),
            productionEnvironment
              ? eq(serviceEnvironments.environmentId, productionEnvironment.id)
              : undefined,
          ),
        )
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
    const service = await this.db.query.services.findFirst({
      where: and(eq(services.organizationId, organizationId), eq(services.slug, slug)),
    });
    if (!service) {
      throw new NotFoundException("Serviço não encontrado");
    }

    const [team, owners, environmentsRows, recentDeployments, dependencies, dependents, affectedIncidents, latestMetrics, serviceApis] =
      await Promise.all([
        service.teamId
          ? this.db.query.teams.findFirst({ where: eq(teams.id, service.teamId) })
          : Promise.resolve(undefined),
        this.db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(serviceOwners)
          .innerJoin(users, eq(serviceOwners.userId, users.id))
          .where(eq(serviceOwners.serviceId, service.id)),
        this.db
          .select({
            id: environments.id,
            name: environments.name,
            slug: environments.slug,
            health: serviceEnvironments.health,
            version: serviceEnvironments.version,
            replicas: serviceEnvironments.replicas,
            cpuUsage: serviceEnvironments.cpuUsage,
            memoryUsage: serviceEnvironments.memoryUsage,
            latencyMs: serviceEnvironments.latencyMs,
            errorRate: serviceEnvironments.errorRate,
            lastDeployedAt: serviceEnvironments.lastDeployedAt,
          })
          .from(serviceEnvironments)
          .innerJoin(environments, eq(serviceEnvironments.environmentId, environments.id))
          .where(eq(serviceEnvironments.serviceId, service.id)),
        this.db
          .select({
            id: deployments.id,
            version: deployments.version,
            status: deployments.status,
            createdAt: deployments.createdAt,
            environmentName: environments.name,
            authorName: users.name,
          })
          .from(deployments)
          .innerJoin(environments, eq(deployments.environmentId, environments.id))
          .leftJoin(users, eq(deployments.authorId, users.id))
          .where(eq(deployments.serviceId, service.id))
          .orderBy(desc(deployments.createdAt))
          .limit(10),
        this.db
          .select({
            id: serviceDependencies.id,
            externalName: serviceDependencies.externalName,
            dependsOnServiceId: serviceDependencies.dependsOnServiceId,
          })
          .from(serviceDependencies)
          .where(eq(serviceDependencies.serviceId, service.id)),
        this.db
          .select({ id: services.id, name: services.name, slug: services.slug })
          .from(serviceDependencies)
          .innerJoin(services, eq(serviceDependencies.serviceId, services.id))
          .where(eq(serviceDependencies.dependsOnServiceId, service.id)),
        this.db
          .select({
            id: incidents.id,
            title: incidents.title,
            severity: incidents.severity,
            status: incidents.status,
            detectedAt: incidents.detectedAt,
          })
          .from(incidentServices)
          .innerJoin(incidents, eq(incidentServices.incidentId, incidents.id))
          .where(eq(incidentServices.serviceId, service.id))
          .orderBy(desc(incidents.detectedAt))
          .limit(10),
        this.db
          .select({ name: metrics.name, value: metrics.value, unit: metrics.unit, timestamp: metrics.timestamp })
          .from(metrics)
          .where(eq(metrics.serviceId, service.id))
          .orderBy(desc(metrics.timestamp))
          .limit(50),
        this.db
          .select({ id: apis.id, name: apis.name, slug: apis.slug, protocol: apis.protocol, status: apis.status })
          .from(apis)
          .where(eq(apis.serviceId, service.id)),
      ]);

    const dependencyNames = await this.resolveDependencyNames(dependencies);
    const latestMetricByName = new Map<string, (typeof latestMetrics)[number]>();
    for (const metric of latestMetrics) {
      if (!latestMetricByName.has(metric.name)) {
        latestMetricByName.set(metric.name, metric);
      }
    }

    return {
      service,
      team,
      owners,
      environments: environmentsRows,
      recentDeployments,
      dependencies: dependencyNames,
      dependents,
      incidents: affectedIncidents,
      metrics: Array.from(latestMetricByName.values()),
      apis: serviceApis,
    };
  }

  private async resolveDependencyNames(
    dependencies: Array<{ id: string; externalName: string | null; dependsOnServiceId: string | null }>,
  ) {
    const serviceIds = dependencies
      .map((dependency) => dependency.dependsOnServiceId)
      .filter((id): id is string => id !== null);

    const relatedServices =
      serviceIds.length > 0
        ? await this.db
            .select({ id: services.id, name: services.name, slug: services.slug })
            .from(services)
            .where(or(...serviceIds.map((id) => eq(services.id, id))))
        : [];
    const serviceById = new Map(relatedServices.map((service) => [service.id, service]));

    return dependencies.map((dependency) => ({
      id: dependency.id,
      name: dependency.externalName ?? serviceById.get(dependency.dependsOnServiceId ?? "")?.name ?? "desconhecido",
      slug: dependency.dependsOnServiceId ? serviceById.get(dependency.dependsOnServiceId)?.slug : undefined,
      isExternal: dependency.externalName !== null,
    }));
  }
}
