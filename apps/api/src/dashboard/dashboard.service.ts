import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import {
  deployments,
  environments,
  incidents,
  serviceEnvironments,
  serviceOwners,
  services,
  teamMembers,
  users,
} from "@nexus/database";
import { and, count, desc, eq, gte, inArray, ne, or } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";

const RECENT_DEPLOYMENTS_LIMIT = 8;
const ACTIVE_INCIDENTS_LIMIT = 5;
const MY_SERVICES_LIMIT = 6;
const FAILED_DEPLOYMENTS_WINDOW_DAYS = 7;

@Injectable()
export class DashboardService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async getSummary(organizationId: string, userId: string) {
    const [
      servicesCount,
      deploymentsToday,
      activeIncidentsCount,
      failedDeployments,
      healthSummary,
      myServices,
      recentDeployments,
      activeIncidents,
    ] = await Promise.all([
      this.countServices(organizationId),
      this.countDeploymentsToday(organizationId),
      this.countActiveIncidents(organizationId),
      this.countFailedDeployments(organizationId),
      this.getProductionHealthSummary(organizationId),
      this.getMyServices(organizationId, userId),
      this.getRecentDeployments(organizationId),
      this.getActiveIncidents(organizationId),
    ]);

    return {
      kpis: {
        servicesCount,
        deploymentsToday,
        activeIncidents: activeIncidentsCount,
        failedDeployments,
        uptimePercentage: healthSummary.uptimePercentage,
        sloCompliance: healthSummary.sloCompliance,
      },
      myServices,
      recentDeployments,
      activeIncidents,
    };
  }

  private async countServices(organizationId: string): Promise<number> {
    const rows = await this.db
      .select({ value: count() })
      .from(services)
      .where(eq(services.organizationId, organizationId));
    return rows[0]?.value ?? 0;
  }

  private async countDeploymentsToday(organizationId: string): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const rows = await this.db
      .select({ value: count() })
      .from(deployments)
      .innerJoin(services, eq(deployments.serviceId, services.id))
      .where(
        and(eq(services.organizationId, organizationId), gte(deployments.createdAt, startOfToday)),
      );
    return rows[0]?.value ?? 0;
  }

  private async countActiveIncidents(organizationId: string): Promise<number> {
    const rows = await this.db
      .select({ value: count() })
      .from(incidents)
      .where(and(eq(incidents.organizationId, organizationId), ne(incidents.status, "resolved")));
    return rows[0]?.value ?? 0;
  }

  private async countFailedDeployments(organizationId: string): Promise<number> {
    const since = new Date(Date.now() - FAILED_DEPLOYMENTS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({ value: count() })
      .from(deployments)
      .innerJoin(services, eq(deployments.serviceId, services.id))
      .where(
        and(
          eq(services.organizationId, organizationId),
          eq(deployments.status, "failed"),
          gte(deployments.createdAt, since),
        ),
      );
    return rows[0]?.value ?? 0;
  }

  /**
   * uptime/SLO ainda não têm um cálculo formal (chega na Phase 12 — Reports).
   * Por ora, usamos a saúde reportada em service_environments (produção) como
   * proxy: uptime = % "healthy"; SLO compliance = % "healthy" ou "degraded"
   * (só "unhealthy" conta como violação).
   */
  private async getProductionHealthSummary(
    organizationId: string,
  ): Promise<{ uptimePercentage: number; sloCompliance: number }> {
    const productionEnvironment = await this.db.query.environments.findFirst({
      where: and(eq(environments.organizationId, organizationId), eq(environments.slug, "production")),
    });

    if (!productionEnvironment) {
      return { uptimePercentage: 100, sloCompliance: 100 };
    }

    const rows = await this.db
      .select({ health: serviceEnvironments.health })
      .from(serviceEnvironments)
      .innerJoin(services, eq(serviceEnvironments.serviceId, services.id))
      .where(
        and(
          eq(services.organizationId, organizationId),
          eq(serviceEnvironments.environmentId, productionEnvironment.id),
        ),
      );

    if (rows.length === 0) {
      return { uptimePercentage: 100, sloCompliance: 100 };
    }

    const healthyCount = rows.filter((row) => row.health === "healthy").length;
    const notUnhealthyCount = rows.filter((row) => row.health !== "unhealthy").length;

    return {
      uptimePercentage: roundToOneDecimal((healthyCount / rows.length) * 100),
      sloCompliance: roundToOneDecimal((notUnhealthyCount / rows.length) * 100),
    };
  }

  private async getMyServices(organizationId: string, userId: string) {
    const teamRows = await this.db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    const ownedRows = await this.db
      .select({ serviceId: serviceOwners.serviceId })
      .from(serviceOwners)
      .where(eq(serviceOwners.userId, userId));

    const teamIds = teamRows.map((row) => row.teamId);
    const ownedServiceIds = ownedRows.map((row) => row.serviceId);

    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push(inArray(services.teamId, teamIds));
    if (ownedServiceIds.length > 0) membershipConditions.push(inArray(services.id, ownedServiceIds));

    if (membershipConditions.length === 0) {
      return [];
    }

    return this.db
      .select({
        id: services.id,
        name: services.name,
        slug: services.slug,
        type: services.type,
        lifecycle: services.lifecycle,
      })
      .from(services)
      .where(and(eq(services.organizationId, organizationId), or(...membershipConditions)))
      .limit(MY_SERVICES_LIMIT);
  }

  private async getRecentDeployments(organizationId: string) {
    return this.db
      .select({
        id: deployments.id,
        version: deployments.version,
        status: deployments.status,
        createdAt: deployments.createdAt,
        serviceName: services.name,
        environmentName: environments.name,
        authorName: users.name,
      })
      .from(deployments)
      .innerJoin(services, eq(deployments.serviceId, services.id))
      .innerJoin(environments, eq(deployments.environmentId, environments.id))
      .leftJoin(users, eq(deployments.authorId, users.id))
      .where(eq(services.organizationId, organizationId))
      .orderBy(desc(deployments.createdAt))
      .limit(RECENT_DEPLOYMENTS_LIMIT);
  }

  private async getActiveIncidents(organizationId: string) {
    return this.db
      .select({
        id: incidents.id,
        title: incidents.title,
        severity: incidents.severity,
        status: incidents.status,
        detectedAt: incidents.detectedAt,
      })
      .from(incidents)
      .where(and(eq(incidents.organizationId, organizationId), ne(incidents.status, "resolved")))
      .orderBy(desc(incidents.detectedAt))
      .limit(ACTIVE_INCIDENTS_LIMIT);
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
