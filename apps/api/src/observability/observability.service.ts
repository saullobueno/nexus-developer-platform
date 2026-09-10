import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import { errorEvents, logLevelEnum, logs, metrics, services, spans, traces } from "@nexus/database";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import { RANGE_TO_HOURS, type ListMetricsQuery } from "./dto/list-metrics.dto";
import type { ListLogsQuery } from "./dto/list-logs.dto";
import type { ListTracesQuery } from "./dto/list-traces.dto";
import type { ListErrorsQuery } from "./dto/list-errors.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export interface MetricSeries {
  name: string;
  unit: string | null;
  points: Array<{ timestamp: Date; value: number }>;
}

@Injectable()
export class ObservabilityService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async getMetrics(organizationId: string, query: ListMetricsQuery) {
    const since = new Date(Date.now() - RANGE_TO_HOURS[query.range]! * 60 * 60 * 1000);
    const conditions = [eq(services.organizationId, organizationId), gte(metrics.timestamp, since)];
    if (query.service) conditions.push(eq(services.slug, query.service));

    const rows = await this.db
      .select({
        name: metrics.name,
        value: metrics.value,
        unit: metrics.unit,
        timestamp: metrics.timestamp,
      })
      .from(metrics)
      .innerJoin(services, eq(metrics.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(metrics.timestamp);

    const seriesByName = new Map<string, MetricSeries>();
    for (const row of rows) {
      let series = seriesByName.get(row.name);
      if (!series) {
        series = { name: row.name, unit: row.unit, points: [] };
        seriesByName.set(row.name, series);
      }
      series.points.push({ timestamp: row.timestamp, value: row.value });
    }

    return { range: query.range, series: Array.from(seriesByName.values()) };
  }

  async getLogs(organizationId: string, query: ListLogsQuery) {
    const conditions = [eq(services.organizationId, organizationId)];
    if (query.service) conditions.push(eq(services.slug, query.service));
    if (query.level && isOneOf(query.level, logLevelEnum.enumValues)) {
      conditions.push(eq(logs.level, query.level));
    }
    if (query.traceId) conditions.push(eq(logs.traceId, query.traceId));
    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: logs.id,
          level: logs.level,
          message: logs.message,
          traceId: logs.traceId,
          timestamp: logs.timestamp,
          serviceName: services.name,
          serviceSlug: services.slug,
        })
        .from(logs)
        .innerJoin(services, eq(logs.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(logs.timestamp))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(logs)
        .innerJoin(services, eq(logs.serviceId, services.id))
        .where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }

  async getTraces(organizationId: string, query: ListTracesQuery) {
    const conditions = [eq(services.organizationId, organizationId)];
    if (query.service) conditions.push(eq(services.slug, query.service));
    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: traces.id,
          traceId: traces.traceId,
          durationMs: traces.durationMs,
          startedAt: traces.startedAt,
          serviceName: services.name,
        })
        .from(traces)
        .innerJoin(services, eq(traces.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(traces.startedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(traces)
        .innerJoin(services, eq(traces.serviceId, services.id))
        .where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }

  async getTraceById(organizationId: string, id: string) {
    const traceRows = await this.db
      .select({ trace: traces, serviceOrganizationId: services.organizationId })
      .from(traces)
      .innerJoin(services, eq(traces.serviceId, services.id))
      .where(eq(traces.id, id))
      .limit(1);

    const result = traceRows[0];
    if (!result || result.serviceOrganizationId !== organizationId) {
      throw new NotFoundException("Trace não encontrado");
    }

    const spanRows = await this.db
      .select({
        id: spans.id,
        name: spans.name,
        startedAt: spans.startedAt,
        durationMs: spans.durationMs,
        parentSpanId: spans.parentSpanId,
        serviceName: services.name,
      })
      .from(spans)
      .innerJoin(services, eq(spans.serviceId, services.id))
      .where(eq(spans.traceId, id))
      .orderBy(spans.startedAt);

    return { trace: result.trace, spans: spanRows };
  }

  async getErrors(organizationId: string, query: ListErrorsQuery) {
    const conditions = [eq(services.organizationId, organizationId)];
    if (query.service) conditions.push(eq(services.slug, query.service));
    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: errorEvents.id,
          type: errorEvents.type,
          message: errorEvents.message,
          occurrences: errorEvents.occurrences,
          affectedUsers: errorEvents.affectedUsers,
          firstSeenAt: errorEvents.firstSeenAt,
          lastSeenAt: errorEvents.lastSeenAt,
          serviceName: services.name,
          serviceSlug: services.slug,
        })
        .from(errorEvents)
        .innerJoin(services, eq(errorEvents.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(errorEvents.lastSeenAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(errorEvents)
        .innerJoin(services, eq(errorEvents.serviceId, services.id))
        .where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }
}
