import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import { deployments, environments, incidentServices, incidents, serviceEnvironments, services } from "@nexus/database";
import { and, eq, gte, inArray } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { GetReportsQuery } from "./dto/get-reports.dto";

const FAILED_STATUSES = new Set(["failed", "rolled_back"]);
const TARGET_UPTIME = 99.9;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async get(organizationId: string, query: GetReportsQuery) {
    const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

    const orgServices = await this.db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.organizationId, organizationId));
    const serviceIds = orgServices.map((service) => service.id);

    if (serviceIds.length === 0) {
      return {
        days: query.days,
        dora: { deploymentFrequencyPerDay: 0, leadTimeForChangesHours: null, changeFailureRate: null, mttrHours: null },
        reliability: { uptimeAvg: null, errorBudgetRemaining: null, targetUptime: TARGET_UPTIME },
        delivery: { totalDeployments: 0, failedDeployments: 0, rollbackRate: null, avgPipelineDurationMs: null },
      };
    }

    const [windowDeployments, resolvedIncidents, productionEnvironment] = await Promise.all([
      this.db
        .select({ status: deployments.status, durationMs: deployments.durationMs })
        .from(deployments)
        .where(and(inArray(deployments.serviceId, serviceIds), gte(deployments.createdAt, since))),
      this.db
        .selectDistinct({ detectedAt: incidents.detectedAt, resolvedAt: incidents.resolvedAt })
        .from(incidentServices)
        .innerJoin(incidents, eq(incidentServices.incidentId, incidents.id))
        .where(and(inArray(incidentServices.serviceId, serviceIds), eq(incidents.status, "resolved"))),
      this.db.query.environments.findFirst({
        where: and(eq(environments.organizationId, organizationId), eq(environments.slug, "production")),
      }),
    ]);

    const productionHealth = productionEnvironment
      ? await this.db
          .select({ errorRate: serviceEnvironments.errorRate })
          .from(serviceEnvironments)
          .where(
            and(
              inArray(serviceEnvironments.serviceId, serviceIds),
              eq(serviceEnvironments.environmentId, productionEnvironment.id),
            ),
          )
      : [];

    const totalDeployments = windowDeployments.length;
    const failedDeployments = windowDeployments.filter((deployment) => FAILED_STATUSES.has(deployment.status)).length;
    const rolledBackDeployments = windowDeployments.filter((deployment) => deployment.status === "rolled_back").length;
    const durations = windowDeployments
      .map((deployment) => deployment.durationMs)
      .filter((value): value is number => value !== null);

    const mttrHours = average(
      resolvedIncidents
        .filter((incident) => incident.resolvedAt !== null)
        .map((incident) => (incident.resolvedAt!.getTime() - incident.detectedAt.getTime()) / (1000 * 60 * 60)),
    );

    const errorRates = productionHealth
      .map((row) => row.errorRate)
      .filter((value): value is number => value !== null);
    const uptimeAvg = errorRates.length > 0 ? 100 - average(errorRates)! : null;

    return {
      days: query.days,
      dora: {
        deploymentFrequencyPerDay: Number((totalDeployments / query.days).toFixed(2)),
        // Proxy: duração do deployment (não temos timestamp de commit no schema para o
        // lead time "commit → produção" clássico do DORA). Ver ADR 0011.
        leadTimeForChangesHours:
          durations.length > 0 ? Number((average(durations)! / (1000 * 60 * 60)).toFixed(2)) : null,
        changeFailureRate:
          totalDeployments > 0 ? Number(((failedDeployments / totalDeployments) * 100).toFixed(1)) : null,
        mttrHours: mttrHours !== null ? Number(mttrHours.toFixed(1)) : null,
      },
      reliability: {
        uptimeAvg: uptimeAvg !== null ? Number(uptimeAvg.toFixed(2)) : null,
        errorBudgetRemaining: uptimeAvg !== null ? Number((uptimeAvg - TARGET_UPTIME).toFixed(2)) : null,
        targetUptime: TARGET_UPTIME,
      },
      delivery: {
        totalDeployments,
        failedDeployments,
        rollbackRate: totalDeployments > 0 ? Number(((rolledBackDeployments / totalDeployments) * 100).toFixed(1)) : null,
        avgPipelineDurationMs: durations.length > 0 ? Math.round(average(durations)!) : null,
      },
    };
  }
}
