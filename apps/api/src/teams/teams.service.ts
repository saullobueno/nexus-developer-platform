import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import {
  apis,
  deployments,
  documents,
  environments,
  incidentServices,
  incidents,
  serviceEnvironments,
  services,
  teamMembers,
  teams,
  users,
} from "@nexus/database";
import { and, count, desc, eq, gte, ilike, inArray } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListTeamsQuery } from "./dto/list-teams.dto";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TeamsService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async list(organizationId: string, query: ListTeamsQuery) {
    const conditions = [eq(teams.organizationId, organizationId)];
    if (query.search) conditions.push(ilike(teams.name, `%${query.search}%`));

    const [teamRows, totalRows] = await Promise.all([
      this.db
        .select({ id: teams.id, name: teams.name, slug: teams.slug, description: teams.description })
        .from(teams)
        .where(and(...conditions))
        .orderBy(teams.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(teams).where(and(...conditions)),
    ]);

    const items = await Promise.all(
      teamRows.map(async (team) => {
        const [memberRows, serviceRows] = await Promise.all([
          this.db.select({ userId: teamMembers.userId }).from(teamMembers).where(eq(teamMembers.teamId, team.id)),
          this.db.select({ id: services.id }).from(services).where(eq(services.teamId, team.id)),
        ]);
        return { ...team, memberCount: memberRows.length, serviceCount: serviceRows.length };
      }),
    );

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }

  async getBySlug(organizationId: string, slug: string) {
    const team = await this.db.query.teams.findFirst({
      where: and(eq(teams.organizationId, organizationId), eq(teams.slug, slug)),
    });
    if (!team) {
      throw new NotFoundException("Time não encontrado");
    }

    const [members, teamServices, teamApis] = await Promise.all([
      this.db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, team.id)),
      this.db
        .select({ id: services.id, name: services.name, slug: services.slug, lifecycle: services.lifecycle })
        .from(services)
        .where(eq(services.teamId, team.id)),
      this.db
        .select({ id: apis.id, name: apis.name, slug: apis.slug, protocol: apis.protocol })
        .from(apis)
        .where(eq(apis.teamId, team.id)),
    ]);

    const serviceIds = teamServices.map((service) => service.id);

    const [teamDocuments, recentIncidents, recentDeployments, productionEnvironment] =
      serviceIds.length > 0
        ? await Promise.all([
            this.db
              .select({ id: documents.id, title: documents.title, slug: documents.slug, category: documents.category })
              .from(documents)
              .where(inArray(documents.serviceId, serviceIds)),
            this.db
              .selectDistinct({
                id: incidents.id,
                title: incidents.title,
                severity: incidents.severity,
                status: incidents.status,
                detectedAt: incidents.detectedAt,
                resolvedAt: incidents.resolvedAt,
              })
              .from(incidentServices)
              .innerJoin(incidents, eq(incidentServices.incidentId, incidents.id))
              .where(inArray(incidentServices.serviceId, serviceIds))
              .orderBy(desc(incidents.detectedAt))
              .limit(10),
            this.db
              .select({
                id: deployments.id,
                version: deployments.version,
                status: deployments.status,
                createdAt: deployments.createdAt,
                serviceId: deployments.serviceId,
              })
              .from(deployments)
              .where(inArray(deployments.serviceId, serviceIds))
              .orderBy(desc(deployments.createdAt))
              .limit(10),
            this.db.query.environments.findFirst({
              where: and(eq(environments.organizationId, organizationId), eq(environments.slug, "production")),
            }),
          ])
        : [[], [], [], undefined];

    const since30d = new Date(Date.now() - THIRTY_DAYS_MS);

    const [deploymentsLast30d, incidentsLast30d, resolvedIncidents, productionHealth] =
      serviceIds.length > 0
        ? await Promise.all([
            this.db
              .select({ id: deployments.id, status: deployments.status })
              .from(deployments)
              .where(and(inArray(deployments.serviceId, serviceIds), gte(deployments.createdAt, since30d))),
            this.db
              .selectDistinct({ id: incidents.id })
              .from(incidentServices)
              .innerJoin(incidents, eq(incidentServices.incidentId, incidents.id))
              .where(and(inArray(incidentServices.serviceId, serviceIds), gte(incidents.detectedAt, since30d))),
            this.db
              .selectDistinct({ detectedAt: incidents.detectedAt, resolvedAt: incidents.resolvedAt })
              .from(incidentServices)
              .innerJoin(incidents, eq(incidentServices.incidentId, incidents.id))
              .where(and(inArray(incidentServices.serviceId, serviceIds), eq(incidents.status, "resolved"))),
            productionEnvironment
              ? this.db
                  .select({ errorRate: serviceEnvironments.errorRate })
                  .from(serviceEnvironments)
                  .where(
                    and(
                      inArray(serviceEnvironments.serviceId, serviceIds),
                      eq(serviceEnvironments.environmentId, productionEnvironment.id),
                    ),
                  )
              : Promise.resolve([]),
          ])
        : [[], [], [], []];

    const deploymentFrequencyPerWeek =
      serviceIds.length > 0 ? Number(((deploymentsLast30d.length / 30) * 7).toFixed(1)) : 0;

    const mttrHours =
      resolvedIncidents.length > 0
        ? Number(
            (
              resolvedIncidents.reduce((sum, incident) => {
                if (!incident.resolvedAt) return sum;
                return sum + (incident.resolvedAt.getTime() - incident.detectedAt.getTime());
              }, 0) /
              resolvedIncidents.length /
              (1000 * 60 * 60)
            ).toFixed(1),
          )
        : null;

    const errorRates = productionHealth
      .map((row) => row.errorRate)
      .filter((value): value is number => value !== null);
    const uptimeAvg =
      errorRates.length > 0
        ? Number((100 - errorRates.reduce((sum, value) => sum + value, 0) / errorRates.length).toFixed(2))
        : null;

    return {
      team,
      members,
      services: teamServices,
      apis: teamApis,
      documents: teamDocuments,
      incidents: recentIncidents,
      deployments: recentDeployments,
      kpis: {
        servicesCount: teamServices.length,
        deploymentsCount30d: deploymentsLast30d.length,
        incidentsCount30d: incidentsLast30d.length,
        uptimeAvg,
        mttrHours,
        deploymentFrequencyPerWeek,
      },
    };
  }
}
