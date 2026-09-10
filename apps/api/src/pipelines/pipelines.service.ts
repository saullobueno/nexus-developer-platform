import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import { deployments, pipelineRuns, pipelineStages, pipelines, services, users } from "@nexus/database";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListPipelinesQuery } from "./dto/list-pipelines.dto";
import type { ListRunsQuery } from "./dto/list-runs.dto";

@Injectable()
export class PipelinesService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async list(organizationId: string, query: ListPipelinesQuery) {
    const conditions = [eq(services.organizationId, organizationId)];
    if (query.search) {
      conditions.push(ilike(pipelines.name, `%${query.search}%`));
    }
    if (query.service) conditions.push(eq(services.slug, query.service));

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: pipelines.id,
          name: pipelines.name,
          serviceName: services.name,
          serviceSlug: services.slug,
        })
        .from(pipelines)
        .innerJoin(services, eq(pipelines.serviceId, services.id))
        .where(whereClause)
        .orderBy(pipelines.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(pipelines)
        .innerJoin(services, eq(pipelines.serviceId, services.id))
        .where(whereClause),
    ]);

    const latestRuns = await Promise.all(
      items.map((pipeline) =>
        this.db
          .select({
            id: pipelineRuns.id,
            status: pipelineRuns.status,
            startedAt: pipelineRuns.startedAt,
            finishedAt: pipelineRuns.finishedAt,
          })
          .from(pipelineRuns)
          .where(eq(pipelineRuns.pipelineId, pipeline.id))
          .orderBy(desc(pipelineRuns.createdAt))
          .limit(1)
          .then((rows) => rows[0] ?? null),
      ),
    );

    return {
      items: items.map((pipeline, index) => ({ ...pipeline, latestRun: latestRuns[index] })),
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getById(organizationId: string, id: string, query: ListRunsQuery) {
    const pipelineRows = await this.db
      .select({ id: pipelines.id, name: pipelines.name, serviceName: services.name, serviceSlug: services.slug })
      .from(pipelines)
      .innerJoin(services, eq(pipelines.serviceId, services.id))
      .where(and(eq(pipelines.id, id), eq(services.organizationId, organizationId)));
    const pipeline = pipelineRows[0];
    if (!pipeline) {
      throw new NotFoundException("Pipeline não encontrado");
    }

    const [runs, totalRows] = await Promise.all([
      this.db
        .select({
          id: pipelineRuns.id,
          status: pipelineRuns.status,
          startedAt: pipelineRuns.startedAt,
          finishedAt: pipelineRuns.finishedAt,
          deploymentId: pipelineRuns.deploymentId,
          deploymentVersion: deployments.version,
          triggeredByName: users.name,
        })
        .from(pipelineRuns)
        .leftJoin(deployments, eq(pipelineRuns.deploymentId, deployments.id))
        .leftJoin(users, eq(pipelineRuns.triggeredById, users.id))
        .where(eq(pipelineRuns.pipelineId, id))
        .orderBy(desc(pipelineRuns.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(pipelineRuns).where(eq(pipelineRuns.pipelineId, id)),
    ]);

    return {
      pipeline,
      runs: { items: runs, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize },
    };
  }

  async getRunById(organizationId: string, runId: string) {
    const runRows = await this.db
      .select({
        id: pipelineRuns.id,
        status: pipelineRuns.status,
        startedAt: pipelineRuns.startedAt,
        finishedAt: pipelineRuns.finishedAt,
        deploymentId: pipelineRuns.deploymentId,
        deploymentVersion: deployments.version,
        triggeredByName: users.name,
        pipelineId: pipelines.id,
        pipelineName: pipelines.name,
        serviceName: services.name,
        serviceSlug: services.slug,
      })
      .from(pipelineRuns)
      .innerJoin(pipelines, eq(pipelineRuns.pipelineId, pipelines.id))
      .innerJoin(services, eq(pipelines.serviceId, services.id))
      .leftJoin(deployments, eq(pipelineRuns.deploymentId, deployments.id))
      .leftJoin(users, eq(pipelineRuns.triggeredById, users.id))
      .where(and(eq(pipelineRuns.id, runId), eq(services.organizationId, organizationId)));
    const run = runRows[0];
    if (!run) {
      throw new NotFoundException("Execução de pipeline não encontrada");
    }

    const stages = await this.db
      .select({
        id: pipelineStages.id,
        name: pipelineStages.name,
        order: pipelineStages.order,
        status: pipelineStages.status,
        startedAt: pipelineStages.startedAt,
        finishedAt: pipelineStages.finishedAt,
        durationMs: pipelineStages.durationMs,
        logs: pipelineStages.logs,
      })
      .from(pipelineStages)
      .where(eq(pipelineStages.pipelineRunId, runId))
      .orderBy(pipelineStages.order);

    return { run, stages };
  }
}
