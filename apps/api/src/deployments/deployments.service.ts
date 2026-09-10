import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import {
  auditLogs,
  deploymentLogs,
  deploymentStatusEnum,
  deployments,
  environments,
  pipelineRuns,
  pipelineStages,
  services,
  users,
} from "@nexus/database";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListDeploymentsQuery } from "./dto/list-deployments.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

const CANCELLABLE_STATUSES = ["queued", "running"] as const;

@Injectable()
export class DeploymentsService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async list(organizationId: string, query: ListDeploymentsQuery) {
    const conditions = [eq(services.organizationId, organizationId)];
    if (query.service) conditions.push(eq(services.slug, query.service));
    if (query.environment) conditions.push(eq(environments.slug, query.environment));
    if (query.status && isOneOf(query.status, deploymentStatusEnum.enumValues)) {
      conditions.push(eq(deployments.status, query.status));
    }
    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: deployments.id,
          version: deployments.version,
          status: deployments.status,
          commitSha: deployments.commitSha,
          startedAt: deployments.startedAt,
          finishedAt: deployments.finishedAt,
          durationMs: deployments.durationMs,
          createdAt: deployments.createdAt,
          serviceName: services.name,
          serviceSlug: services.slug,
          environmentName: environments.name,
          authorName: users.name,
        })
        .from(deployments)
        .innerJoin(services, eq(deployments.serviceId, services.id))
        .innerJoin(environments, eq(deployments.environmentId, environments.id))
        .leftJoin(users, eq(deployments.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(deployments.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ value: count() })
        .from(deployments)
        .innerJoin(services, eq(deployments.serviceId, services.id))
        .innerJoin(environments, eq(deployments.environmentId, environments.id))
        .where(whereClause),
    ]);

    return { items, total: totalRows[0]?.value ?? 0, page: query.page, pageSize: query.pageSize };
  }

  async getById(organizationId: string, id: string) {
    const scoped = await this.getScoped(organizationId, id);

    const [logs, runs, author] = await Promise.all([
      this.db
        .select()
        .from(deploymentLogs)
        .where(eq(deploymentLogs.deploymentId, id))
        .orderBy(deploymentLogs.timestamp),
      this.db.select().from(pipelineRuns).where(eq(pipelineRuns.deploymentId, id)),
      scoped.deployment.authorId
        ? this.db.query.users.findFirst({ where: eq(users.id, scoped.deployment.authorId) })
        : Promise.resolve(undefined),
    ]);

    const run = runs[0];
    const stages = run
      ? await this.db
          .select()
          .from(pipelineStages)
          .where(eq(pipelineStages.pipelineRunId, run.id))
          .orderBy(pipelineStages.order)
      : [];

    return {
      deployment: scoped.deployment,
      service: { id: scoped.serviceId, name: scoped.serviceName, slug: scoped.serviceSlug },
      environment: { id: scoped.environmentId, name: scoped.environmentName },
      author,
      logs,
      stages,
    };
  }

  async cancel(organizationId: string, actor: AuthenticatedUser, id: string) {
    const scoped = await this.getScoped(organizationId, id);
    if (!isOneOf(scoped.deployment.status, CANCELLABLE_STATUSES)) {
      throw new BadRequestException("Só é possível cancelar deployments em andamento ou na fila");
    }

    const [updated] = await this.db
      .update(deployments)
      .set({ status: "cancelled", finishedAt: new Date() })
      .where(eq(deployments.id, id))
      .returning();

    await this.recordAudit(organizationId, actor.id, "deployment.cancel", id, scoped.deployment, updated);
    return updated;
  }

  async retry(organizationId: string, actor: AuthenticatedUser, id: string) {
    const scoped = await this.getScoped(organizationId, id);
    if (scoped.deployment.status !== "failed") {
      throw new BadRequestException("Só é possível refazer deployments que falharam");
    }

    const [created] = await this.db
      .insert(deployments)
      .values({
        serviceId: scoped.deployment.serviceId,
        environmentId: scoped.deployment.environmentId,
        authorId: actor.id,
        version: scoped.deployment.version,
        commitSha: scoped.deployment.commitSha,
        commitMessage: scoped.deployment.commitMessage,
        status: "queued",
        startedAt: new Date(),
      })
      .returning();

    await this.recordAudit(organizationId, actor.id, "deployment.retry", created!.id, null, created);
    return created;
  }

  async rollback(organizationId: string, actor: AuthenticatedUser, id: string) {
    const scoped = await this.getScoped(organizationId, id);
    if (scoped.deployment.status !== "successful") {
      throw new BadRequestException("Só é possível fazer rollback de um deployment bem-sucedido");
    }

    const previousRows = await this.db
      .select()
      .from(deployments)
      .where(
        and(
          eq(deployments.serviceId, scoped.deployment.serviceId),
          eq(deployments.environmentId, scoped.deployment.environmentId),
          eq(deployments.status, "successful"),
          lt(deployments.createdAt, scoped.deployment.createdAt),
        ),
      )
      .orderBy(desc(deployments.createdAt))
      .limit(1);

    const previousDeployment = previousRows[0];
    if (!previousDeployment) {
      throw new BadRequestException("Não há uma versão anterior bem-sucedida para reverter");
    }

    const [rolledBack] = await this.db
      .update(deployments)
      .set({ status: "rolled_back", finishedAt: new Date() })
      .where(eq(deployments.id, id))
      .returning();

    const [created] = await this.db
      .insert(deployments)
      .values({
        serviceId: scoped.deployment.serviceId,
        environmentId: scoped.deployment.environmentId,
        authorId: actor.id,
        version: previousDeployment.version,
        commitSha: previousDeployment.commitSha,
        commitMessage: `Rollback para v${previousDeployment.version}`,
        status: "successful",
        startedAt: new Date(),
        finishedAt: new Date(),
        durationMs: 0,
      })
      .returning();

    await this.recordAudit(organizationId, actor.id, "deployment.rollback", id, scoped.deployment, {
      rolledBack,
      created,
    });

    return created;
  }

  private async getScoped(organizationId: string, id: string) {
    const rows = await this.db
      .select({
        deployment: deployments,
        serviceId: services.id,
        serviceName: services.name,
        serviceSlug: services.slug,
        environmentId: environments.id,
        environmentName: environments.name,
      })
      .from(deployments)
      .innerJoin(services, eq(deployments.serviceId, services.id))
      .innerJoin(environments, eq(deployments.environmentId, environments.id))
      .where(and(eq(deployments.id, id), eq(services.organizationId, organizationId)))
      .limit(1);

    const result = rows[0];
    if (!result) {
      throw new NotFoundException("Deployment não encontrado");
    }
    return result;
  }

  private async recordAudit(
    organizationId: string,
    actorId: string,
    action: string,
    resourceId: string,
    before: unknown,
    after: unknown,
  ) {
    await this.db.insert(auditLogs).values({
      organizationId,
      actorId,
      action,
      resource: "deployment",
      resourceId,
      before: before ?? null,
      after: after ?? null,
    });
  }
}
