import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@nexus/auth";
import { runCopilotQuery, type ToolExecutor } from "@nexus/ai";
import type { DatabaseClient } from "@nexus/database";
import { aiAgentRuns, aiMessages, aiToolCalls, services } from "@nexus/database";
import { and, desc, eq } from "drizzle-orm";
import { AuditService } from "../common/audit.service";
import { DATABASE_CLIENT } from "../database/database.constants";
import { DeploymentsService } from "../deployments/deployments.service";
import { DocsService } from "../docs/docs.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import { IncidentsService } from "../incidents/incidents.service";
import { ObservabilityService } from "../observability/observability.service";
import { PipelinesService } from "../pipelines/pipelines.service";
import { RealtimeEventBusService } from "../realtime/realtime-event-bus.service";
import { ServicesService } from "../services/services.service";
import { TeamsService } from "../teams/teams.service";
import type { AskInput } from "./dto/ask.dto";

function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

@Injectable()
export class AiCopilotService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly servicesService: ServicesService,
    private readonly deploymentsService: DeploymentsService,
    private readonly observabilityService: ObservabilityService,
    private readonly incidentsService: IncidentsService,
    private readonly docsService: DocsService,
    private readonly teamsService: TeamsService,
    private readonly pipelinesService: PipelinesService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly auditService: AuditService,
    private readonly realtimeEventBus: RealtimeEventBusService,
  ) {}

  private buildReadExecutors(organizationId: string): Record<string, ToolExecutor> {
    return {
      get_service: async (input) => {
        const detail = await this.servicesService.getBySlug(organizationId, input.slug as string);
        return { service: detail.service, team: detail.team, owners: detail.owners };
      },
      get_service_dependencies: async (input) => {
        const detail = await this.servicesService.getBySlug(organizationId, input.slug as string);
        return { dependencies: detail.dependencies, dependents: detail.dependents };
      },
      get_service_deployments: async (input) => {
        const limit = (input.limit as number | undefined) ?? 10;
        return this.deploymentsService.list(organizationId, {
          service: input.slug as string,
          page: 1,
          pageSize: limit,
        });
      },
      get_service_metrics: async (input) => {
        return this.observabilityService.getMetrics(organizationId, {
          service: input.slug as string,
          range: "24h",
        });
      },
      search_logs: async (input) => {
        return this.observabilityService.getLogs(organizationId, {
          service: input.service as string | undefined,
          level: input.level as string | undefined,
          traceId: input.traceId as string | undefined,
          page: 1,
          pageSize: 20,
        });
      },
      get_trace: async (input) => {
        return this.observabilityService.getTraceById(organizationId, input.id as string);
      },
      get_incident: async (input) => {
        return this.incidentsService.getById(organizationId, input.id as string);
      },
      get_related_incidents: async (input) => {
        return this.incidentsService.list(organizationId, {
          service: input.service as string | undefined,
          page: 1,
          pageSize: 10,
        });
      },
      search_documentation: async (input) => {
        return this.docsService.listDocuments(organizationId, {
          search: input.query as string,
          page: 1,
          pageSize: 10,
        });
      },
      get_team: async (input) => {
        return this.teamsService.getBySlug(organizationId, input.slug as string);
      },
      get_pipeline: async (input) => {
        const result = await this.pipelinesService.list(organizationId, {
          service: input.service as string,
          page: 1,
          pageSize: 1,
        });
        return result.items[0] ?? null;
      },
      get_feature_flag: async (input) => {
        return this.featureFlagsService.getByKey(organizationId, input.key as string);
      },
    };
  }

  private async executeMutatingTool(
    organizationId: string,
    actor: AuthenticatedUser,
    tool: string,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    switch (tool) {
      case "rollback_deployment":
        return this.deploymentsService.rollback(organizationId, actor, input.deploymentId as string);
      case "trigger_deployment":
        return this.deploymentsService.retry(organizationId, actor, input.deploymentId as string);
      case "create_incident":
        return this.incidentsService.create(organizationId, actor, {
          title: input.title as string,
          summary: input.summary as string,
          severity: input.severity as "sev1" | "sev2" | "sev3" | "sev4",
          serviceIds: input.serviceIds as string[],
        });
      case "update_feature_flag": {
        const key = input.key as string;
        const desired = input.enabled as boolean;
        const current = await this.featureFlagsService.getByKey(organizationId, key);
        if (current.flag.enabled === desired) return current.flag;
        return this.featureFlagsService.toggle(organizationId, key, actor);
      }
      default:
        throw new BadRequestException(`Ferramenta mutável "${tool}" desconhecida`);
    }
  }

  async ask(organizationId: string, actor: AuthenticatedUser, input: AskInput) {
    const knownServices = await this.db
      .select({ slug: services.slug })
      .from(services)
      .where(eq(services.organizationId, organizationId));

    const [run] = await this.db
      .insert(aiAgentRuns)
      .values({
        organizationId,
        userId: actor.id,
        model: "pending",
        status: "running",
        promptVersion: "v1",
      })
      .returning();

    this.realtimeEventBus.emit({
      organizationId,
      type: "ai.run.started",
      data: { id: run!.id, question: input.question },
    });

    const startedAt = Date.now();
    const result = await runCopilotQuery({
      question: input.question,
      knownServiceSlugs: knownServices.map((service) => service.slug),
      readExecutors: this.buildReadExecutors(organizationId),
      demoMode: isDemoMode(),
    });
    const durationMs = Date.now() - startedAt;

    await this.db.insert(aiMessages).values([
      { runId: run!.id, role: "user", content: input.question },
      { runId: run!.id, role: "assistant", content: result.summary },
    ]);

    for (const evidence of result.evidence) {
      await this.db.insert(aiToolCalls).values({
        runId: run!.id,
        toolName: evidence.tool,
        input: evidence.input as object,
        output: evidence.output as object,
        isMutating: false,
      });
    }

    for (const action of result.suggestedActions) {
      await this.db.insert(aiToolCalls).values({
        runId: run!.id,
        toolName: action.tool,
        input: action.input,
        output: null,
        isMutating: true,
      });
    }

    const [updatedRun] = await this.db
      .update(aiAgentRuns)
      .set({
        model: result.model,
        status: result.requiresApproval ? "requires_approval" : "completed",
        summary: result.summary,
        confidence: result.confidence,
        requiresApproval: result.requiresApproval,
        finishedAt: new Date(),
        durationMs,
      })
      .where(eq(aiAgentRuns.id, run!.id))
      .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "ai.copilot.ask",
      resource: "ai_agent_run",
      resourceId: run!.id,
      after: { question: input.question, summary: result.summary, usingMock: result.usingMock },
    });

    this.realtimeEventBus.emit({
      organizationId,
      type: "ai.run.completed",
      data: { id: run!.id, status: updatedRun!.status },
    });

    return {
      run: updatedRun,
      ...result,
    };
  }

  async list(organizationId: string) {
    return this.db
      .select({
        id: aiAgentRuns.id,
        model: aiAgentRuns.model,
        status: aiAgentRuns.status,
        summary: aiAgentRuns.summary,
        confidence: aiAgentRuns.confidence,
        requiresApproval: aiAgentRuns.requiresApproval,
        startedAt: aiAgentRuns.startedAt,
        finishedAt: aiAgentRuns.finishedAt,
        durationMs: aiAgentRuns.durationMs,
      })
      .from(aiAgentRuns)
      .where(eq(aiAgentRuns.organizationId, organizationId))
      .orderBy(desc(aiAgentRuns.startedAt))
      .limit(50);
  }

  async getById(organizationId: string, id: string) {
    const run = await this.db.query.aiAgentRuns.findFirst({
      where: and(eq(aiAgentRuns.id, id), eq(aiAgentRuns.organizationId, organizationId)),
    });
    if (!run) {
      throw new NotFoundException("Execução do AI Copilot não encontrada");
    }

    const [messages, toolCalls] = await Promise.all([
      this.db
        .select({ id: aiMessages.id, role: aiMessages.role, content: aiMessages.content, createdAt: aiMessages.createdAt })
        .from(aiMessages)
        .where(eq(aiMessages.runId, id))
        .orderBy(aiMessages.createdAt),
      this.db
        .select()
        .from(aiToolCalls)
        .where(eq(aiToolCalls.runId, id))
        .orderBy(aiToolCalls.createdAt),
    ]);

    const evidence = toolCalls.filter((call) => !call.isMutating);
    const pendingActions = toolCalls.filter((call) => call.isMutating && !call.approvedAt);
    const approvedActions = toolCalls.filter((call) => call.isMutating && call.approvedAt);

    return { run, messages, evidence, pendingActions, approvedActions };
  }

  async approveAction(organizationId: string, actor: AuthenticatedUser, toolCallId: string) {
    const rows = await this.db
      .select({ toolCall: aiToolCalls, run: aiAgentRuns })
      .from(aiToolCalls)
      .innerJoin(aiAgentRuns, eq(aiToolCalls.runId, aiAgentRuns.id))
      .where(and(eq(aiToolCalls.id, toolCallId), eq(aiAgentRuns.organizationId, organizationId)));

    const row = rows[0];
    if (!row) {
      throw new NotFoundException("Ação sugerida não encontrada");
    }
    if (!row.toolCall.isMutating) {
      throw new BadRequestException("Esta ferramenta não é mutável");
    }
    if (row.toolCall.approvedAt) {
      throw new BadRequestException("Esta ação já foi aprovada");
    }

    const output = await this.executeMutatingTool(
      organizationId,
      actor,
      row.toolCall.toolName,
      row.toolCall.input as Record<string, unknown>,
    );

    const [updated] = await this.db
      .update(aiToolCalls)
      .set({ output: output as object, approvedAt: new Date() })
      .where(eq(aiToolCalls.id, toolCallId))
      .returning();

    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: "ai.copilot.approve_action",
      resource: "ai_tool_call",
      resourceId: toolCallId,
      before: { toolName: row.toolCall.toolName, input: row.toolCall.input },
      after: { output },
    });

    return updated;
  }
}
