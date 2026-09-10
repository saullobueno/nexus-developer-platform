import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import {
  deployments,
  incidentEvents,
  incidentSeverityEnum,
  incidentServices,
  incidentStatusEnum,
  incidents,
  logs,
  metrics,
  services,
  users,
} from "@nexus/database";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import { RealtimeEventBusService } from "../realtime/realtime-event-bus.service";
import type { AddIncidentEventDto } from "./dto/add-incident-event.dto";
import type { CreateIncidentDto } from "./dto/create-incident.dto";
import type { ListIncidentsQuery } from "./dto/list-incidents.dto";
import type { UpdateIncidentDto } from "./dto/update-incident.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

const RELATED_DATA_LIMIT = 20;

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly auditService: AuditService,
    private readonly realtimeEventBus: RealtimeEventBusService,
  ) {}

  async list(organizationId: string, query: ListIncidentsQuery) {
    const conditions = [eq(incidents.organizationId, organizationId)];
    if (query.severity && isOneOf(query.severity, incidentSeverityEnum.enumValues)) {
      conditions.push(eq(incidents.severity, query.severity));
    }
    if (query.status && isOneOf(query.status, incidentStatusEnum.enumValues)) {
      conditions.push(eq(incidents.status, query.status));
    }

    if (query.service) {
      const service = await this.db.query.services.findFirst({
        where: and(eq(services.organizationId, organizationId), eq(services.slug, query.service)),
      });
      if (!service) {
        return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
      }

      const relatedRows = await this.db
        .select({ incidentId: incidentServices.incidentId })
        .from(incidentServices)
        .where(eq(incidentServices.serviceId, service.id));
      const incidentIds = relatedRows.map((row) => row.incidentId);
      if (incidentIds.length === 0) {
        return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
      }
      conditions.push(inArray(incidents.id, incidentIds));
    }

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: incidents.id,
          title: incidents.title,
          severity: incidents.severity,
          status: incidents.status,
          detectedAt: incidents.detectedAt,
          resolvedAt: incidents.resolvedAt,
          ownerName: users.name,
        })
        .from(incidents)
        .leftJoin(users, eq(incidents.ownerId, users.id))
        .where(whereClause)
        .orderBy(desc(incidents.detectedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(incidents).where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }

  async getById(organizationId: string, id: string) {
    const incident = await this.getScoped(organizationId, id);

    const [owner, affectedServices, events] = await Promise.all([
      incident.ownerId
        ? this.db.query.users.findFirst({ where: eq(users.id, incident.ownerId) })
        : Promise.resolve(undefined),
      this.db
        .select({
          serviceId: services.id,
          name: services.name,
          slug: services.slug,
          impact: incidentServices.impact,
        })
        .from(incidentServices)
        .innerJoin(services, eq(incidentServices.serviceId, services.id))
        .where(eq(incidentServices.incidentId, id)),
      this.db
        .select({
          id: incidentEvents.id,
          type: incidentEvents.type,
          message: incidentEvents.message,
          createdAt: incidentEvents.createdAt,
          authorName: users.name,
        })
        .from(incidentEvents)
        .leftJoin(users, eq(incidentEvents.authorId, users.id))
        .where(eq(incidentEvents.incidentId, id))
        .orderBy(incidentEvents.createdAt),
    ]);

    const serviceIds = affectedServices.map((service) => service.serviceId);

    const [relatedDeployments, recentLogs, recentMetrics] = await Promise.all([
      serviceIds.length > 0
        ? this.db
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
            .limit(RELATED_DATA_LIMIT)
        : Promise.resolve([]),
      serviceIds.length > 0
        ? this.db
            .select({
              id: logs.id,
              level: logs.level,
              message: logs.message,
              timestamp: logs.timestamp,
              serviceId: logs.serviceId,
            })
            .from(logs)
            .where(inArray(logs.serviceId, serviceIds))
            .orderBy(desc(logs.timestamp))
            .limit(RELATED_DATA_LIMIT)
        : Promise.resolve([]),
      serviceIds.length > 0
        ? this.db
            .select({
              name: metrics.name,
              value: metrics.value,
              unit: metrics.unit,
              timestamp: metrics.timestamp,
              serviceId: metrics.serviceId,
            })
            .from(metrics)
            .where(inArray(metrics.serviceId, serviceIds))
            .orderBy(desc(metrics.timestamp))
            .limit(50)
        : Promise.resolve([]),
    ]);

    return {
      incident,
      owner,
      services: affectedServices,
      events,
      relatedDeployments,
      logs: recentLogs,
      metrics: recentMetrics,
    };
  }

  async create(organizationId: string, actor: AuthenticatedUser, dto: CreateIncidentDto) {
    const validServices = await this.db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.organizationId, organizationId), inArray(services.id, dto.serviceIds)));

    if (validServices.length !== dto.serviceIds.length) {
      throw new BadRequestException("Um ou mais serviços informados são inválidos");
    }

    const [created] = await this.db
      .insert(incidents)
      .values({
        organizationId,
        title: dto.title,
        summary: dto.summary,
        severity: dto.severity,
        status: "investigating",
        ownerId: actor.id,
        detectedAt: new Date(),
      })
      .returning();

    await this.db
      .insert(incidentServices)
      .values(dto.serviceIds.map((serviceId) => ({ incidentId: created!.id, serviceId })));
    await this.db.insert(incidentEvents).values({
      incidentId: created!.id,
      authorId: actor.id,
      type: "detected",
      message: "Incidente criado",
    });

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "incident.create",
      resource: "incident",
      resourceId: created!.id,
      after: created,
    });

    this.realtimeEventBus.emit({
      organizationId,
      type: "incident.created",
      data: { id: created!.id, title: created!.title, severity: created!.severity, status: created!.status },
    });

    return created;
  }

  async update(organizationId: string, actor: AuthenticatedUser, id: string, dto: UpdateIncidentDto) {
    const before = await this.getScoped(organizationId, id);

    const updates: Partial<typeof incidents.$inferInsert> = {};
    if (dto.status) updates.status = dto.status;
    if (dto.severity) updates.severity = dto.severity;
    if (dto.ownerId) updates.ownerId = dto.ownerId;
    if (dto.postmortem !== undefined) updates.postmortem = dto.postmortem;
    if (dto.status === "resolved" && !before.resolvedAt) updates.resolvedAt = new Date();

    if (Object.keys(updates).length === 0) {
      return before;
    }

    const [updated] = await this.db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, id))
      .returning();

    if (dto.status && dto.status !== before.status) {
      await this.db.insert(incidentEvents).values({
        incidentId: id,
        authorId: actor.id,
        type: "status_change",
        message: `Status alterado de ${before.status} para ${dto.status}`,
      });
    }

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "incident.update",
      resource: "incident",
      resourceId: id,
      before,
      after: updated,
    });

    this.realtimeEventBus.emit({
      organizationId,
      type: updated!.status === "resolved" ? "incident.resolved" : "incident.updated",
      data: { id, title: updated!.title, severity: updated!.severity, status: updated!.status },
    });

    return updated;
  }

  async addEvent(organizationId: string, actor: AuthenticatedUser, id: string, dto: AddIncidentEventDto) {
    await this.getScoped(organizationId, id);

    const [event] = await this.db
      .insert(incidentEvents)
      .values({ incidentId: id, authorId: actor.id, type: "update", message: dto.message })
      .returning();

    return event;
  }

  private async getScoped(organizationId: string, id: string) {
    const incident = await this.db.query.incidents.findFirst({
      where: and(eq(incidents.id, id), eq(incidents.organizationId, organizationId)),
    });
    if (!incident) {
      throw new NotFoundException("Incidente não encontrado");
    }
    return incident;
  }
}
