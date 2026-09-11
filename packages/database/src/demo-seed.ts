import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { DatabaseClient } from "./client.js";
import {
  DEMO_ORGANIZATION_NAME,
  DEMO_PASSWORD,
  DEMO_USERS,
  DEPLOYMENT_COMMIT_MESSAGES,
  ENVIRONMENTS,
  FEATURE_FLAGS,
  INCIDENT_TEMPLATES,
  LOG_MESSAGES,
  METRIC_DEFINITIONS,
  SERVICES,
  TEAM_DESCRIPTIONS,
  TEAMS,
} from "./demo/data.js";
import { hoursAgo, pick, randomFloat, randomHex, randomInt } from "./demo/random.js";
import { seedBaseline } from "./seed.js";
import {
  adrs,
  apiConsumers,
  apiEndpoints,
  apis,
  deploymentLogs,
  deployments,
  documents,
  environments,
  errorEvents,
  featureFlagRules,
  featureFlags,
  incidentEvents,
  incidentServices,
  incidents,
  logs,
  metrics,
  pipelineRuns,
  pipelineStages,
  pipelines,
  roles,
  serviceDependencies,
  serviceEnvironments,
  serviceOwners,
  services,
  spans,
  teamMembers,
  teams,
  traces,
  userRoles,
  users,
} from "./schema/index.js";

const PIPELINE_STAGE_NAMES = ["Build", "Unit Tests", "Integration Tests", "Security", "Deploy"];
const DEPLOYMENTS_PER_SERVICE = 6;

export async function seedDemoData(db: DatabaseClient) {
  const { organization } = await seedBaseline(db, DEMO_ORGANIZATION_NAME);

  await db
    .insert(teams)
    .values(
      TEAMS.map((name) => ({
        organizationId: organization.id,
        name,
        slug: slug(name),
        description: TEAM_DESCRIPTIONS[name],
      })),
    )
    .onConflictDoNothing({ target: [teams.organizationId, teams.slug] });
  const allTeams = await db.select().from(teams).where(eq(teams.organizationId, organization.id));
  const teamIdByName = new Map(allTeams.map((team) => [team.name, team.id]));

  for (const demoUser of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await db
      .insert(users)
      .values({
        organizationId: organization.id,
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
      })
      .onConflictDoNothing({ target: users.email });
  }
  const allUsers = await db.select().from(users).where(eq(users.organizationId, organization.id));
  const userIdByEmail = new Map(allUsers.map((user) => [user.email, user.id]));

  const allRoles = await db.select().from(roles);
  const roleIdBySlug = new Map(allRoles.map((role) => [role.slug, role.id]));

  for (const demoUser of DEMO_USERS) {
    const userId = userIdByEmail.get(demoUser.email);
    const roleId = roleIdBySlug.get(demoUser.roleSlug);
    if (userId && roleId) {
      await db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
    }

    const teamId = demoUser.team ? teamIdByName.get(demoUser.team) : undefined;
    if (userId && teamId) {
      await db
        .insert(teamMembers)
        .values({ teamId, userId })
        .onConflictDoNothing({ target: [teamMembers.teamId, teamMembers.userId] });
    }
  }

  await db
    .insert(environments)
    .values(
      ENVIRONMENTS.map((env) => ({
        organizationId: organization.id,
        name: env.name,
        slug: env.slug,
        type: env.type,
      })),
    )
    .onConflictDoNothing({ target: [environments.organizationId, environments.slug] });
  const allEnvironments = await db
    .select()
    .from(environments)
    .where(eq(environments.organizationId, organization.id));
  const environmentIdBySlug = new Map(allEnvironments.map((env) => [env.slug, env.id]));
  const productionEnvironmentId = environmentIdBySlug.get("production");

  for (const serviceDef of SERVICES) {
    await db
      .insert(services)
      .values({
        organizationId: organization.id,
        teamId: teamIdByName.get(serviceDef.team),
        name: serviceDef.name,
        slug: serviceDef.name,
        description: `Serviço ${serviceDef.name}, mantido pelo time ${serviceDef.team}.`,
        type: serviceDef.type,
        lifecycle: serviceDef.lifecycle,
        language: serviceDef.language,
        framework: serviceDef.framework,
        runtime: "Node.js 22",
        repositoryUrl: `https://github.com/acme/${serviceDef.name}`,
      })
      .onConflictDoNothing({ target: services.slug });
  }
  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.organizationId, organization.id));
  const serviceIdByName = new Map(allServices.map((service) => [service.name, service.id]));

  for (const serviceDef of SERVICES) {
    const serviceId = serviceIdByName.get(serviceDef.name);
    if (!serviceId) continue;

    const owner = DEMO_USERS.find((user) => user.team === serviceDef.team);
    const ownerId = owner ? userIdByEmail.get(owner.email) : undefined;
    if (ownerId) {
      await db
        .insert(serviceOwners)
        .values({ serviceId, userId: ownerId })
        .onConflictDoNothing({ target: [serviceOwners.serviceId, serviceOwners.userId] });
    }

    for (const dependencyName of serviceDef.dependsOn ?? []) {
      const dependsOnServiceId = serviceIdByName.get(dependencyName);
      if (dependsOnServiceId) {
        await db.insert(serviceDependencies).values({ serviceId, dependsOnServiceId });
      }
    }
    for (const externalName of serviceDef.externalDependencies ?? []) {
      await db.insert(serviceDependencies).values({ serviceId, externalName });
    }

    for (const envSlug of ["production", "staging"]) {
      const environmentId = environmentIdBySlug.get(envSlug);
      if (!environmentId) continue;
      await db
        .insert(serviceEnvironments)
        .values({
          serviceId,
          environmentId,
          version: "1.4.2",
          health: pick(["healthy", "healthy", "healthy", "degraded"] as const),
          replicas: randomInt(2, 6),
          cpuUsage: randomFloat(20, 70),
          memoryUsage: randomFloat(30, 80),
          latencyMs: randomFloat(40, 300),
          errorRate: randomFloat(0, 2),
          lastDeployedAt: hoursAgo(randomInt(1, 72)),
        })
        .onConflictDoNothing({
          target: [serviceEnvironments.serviceId, serviceEnvironments.environmentId],
        });
    }
  }

  if (productionEnvironmentId) {
    for (const serviceDef of SERVICES) {
      const serviceId = serviceIdByName.get(serviceDef.name);
      if (!serviceId) continue;

      const pipelineRows = await db
        .insert(pipelines)
        .values({ serviceId, name: `${serviceDef.name}-ci` })
        .returning();
      const pipeline = pipelineRows[0];

      for (let index = 0; index < DEPLOYMENTS_PER_SERVICE; index += 1) {
        const isFirst = index === 0;
        const status = isFirst
          ? "successful"
          : pick(["successful", "successful", "successful", "failed", "rolled_back"] as const);
        const startedAt = hoursAgo((index + 1) * randomInt(8, 20));
        const durationMs = randomInt(60_000, 360_000);
        const finishedAt = new Date(startedAt.getTime() + durationMs);
        const authorEmail = pick(DEMO_USERS.map((user) => user.email));

        const deploymentRows = await db
          .insert(deployments)
          .values({
            serviceId,
            environmentId: productionEnvironmentId,
            authorId: userIdByEmail.get(authorEmail),
            version: `1.${DEPLOYMENTS_PER_SERVICE - index}.0`,
            commitSha: randomHex(7),
            commitMessage: pick(DEPLOYMENT_COMMIT_MESSAGES),
            status,
            startedAt,
            finishedAt,
            durationMs,
          })
          .returning();
        const deployment = deploymentRows[0];
        if (!deployment) continue;

        await db.insert(deploymentLogs).values([
          { deploymentId: deployment.id, level: "info", message: "Build iniciado", timestamp: startedAt },
          {
            deploymentId: deployment.id,
            level: status === "failed" ? "error" : "info",
            message: status === "failed" ? "Pipeline falhou na etapa de testes" : "Deploy concluído com sucesso",
            timestamp: finishedAt,
          },
        ]);

        if (!pipeline) continue;
        const runRows = await db
          .insert(pipelineRuns)
          .values({
            pipelineId: pipeline.id,
            deploymentId: deployment.id,
            triggeredById: userIdByEmail.get(authorEmail),
            status,
            startedAt,
            finishedAt,
          })
          .returning();
        const run = runRows[0];
        if (!run) continue;

        const failStageIndex = status === "failed" ? randomInt(1, PIPELINE_STAGE_NAMES.length - 2) : -1;
        await db.insert(pipelineStages).values(
          PIPELINE_STAGE_NAMES.map((name, stageIndex) => {
            const stageStatus = stageStatusFor(stageIndex, failStageIndex);
            return {
              pipelineRunId: run.id,
              name,
              order: stageIndex,
              status: stageStatus,
              startedAt,
              finishedAt,
              durationMs: Math.round(durationMs / PIPELINE_STAGE_NAMES.length),
              logs: stageLogsFor(name, stageStatus),
            };
          }),
        );
      }
    }
  }

  for (const template of INCIDENT_TEMPLATES) {
    const serviceId = serviceIdByName.get(template.service);
    if (!serviceId) continue;

    const ownerEmail = pick(DEMO_USERS.map((user) => user.email));
    const detectedAt = hoursAgo(randomInt(4, 96));
    const resolvedAt = template.status === "resolved" ? hoursAgo(randomInt(0, 3)) : null;

    const incidentRows = await db
      .insert(incidents)
      .values({
        organizationId: organization.id,
        title: template.title,
        summary: `Investigação relacionada a ${template.service}.`,
        severity: template.severity,
        status: template.status,
        ownerId: userIdByEmail.get(ownerEmail),
        detectedAt,
        resolvedAt,
      })
      .returning();
    const incident = incidentRows[0];
    if (!incident) continue;

    await db.insert(incidentServices).values({ incidentId: incident.id, serviceId });

    const timeline: Array<{ type: string; message: string; offsetHours: number }> = [
      { type: "detected", message: "Incidente detectado por alerta automático.", offsetHours: 0 },
      { type: "assigned", message: `Atribuído para ${ownerEmail}.`, offsetHours: 0.25 },
    ];
    if (template.status !== "investigating") {
      timeline.push({ type: "identified", message: "Causa provável identificada.", offsetHours: 1 });
    }
    if (template.status === "monitoring" || template.status === "resolved") {
      timeline.push({ type: "mitigation", message: "Mitigação aplicada, monitorando.", offsetHours: 2 });
    }
    if (template.status === "resolved") {
      timeline.push({ type: "resolved", message: "Incidente resolvido.", offsetHours: 3 });
    }

    await db.insert(incidentEvents).values(
      timeline.map((event) => ({
        incidentId: incident.id,
        authorId: userIdByEmail.get(ownerEmail),
        type: event.type,
        message: event.message,
        createdAt: new Date(detectedAt.getTime() + event.offsetHours * 60 * 60 * 1000),
      })),
    );
  }

  for (const serviceDef of SERVICES) {
    const serviceId = serviceIdByName.get(serviceDef.name);
    if (!serviceId) continue;

    const metricRows = [];
    for (const definition of METRIC_DEFINITIONS) {
      for (let hour = 0; hour < 12; hour += 1) {
        metricRows.push({
          serviceId,
          environmentId: productionEnvironmentId,
          name: definition.name,
          value: randomFloat(
            definition.base - definition.variance,
            definition.base + definition.variance,
          ),
          unit: definition.unit,
          timestamp: hoursAgo(hour),
        });
      }
    }
    await db.insert(metrics).values(metricRows);

    const logRows = Array.from({ length: 15 }, () => {
      const entry = pick(LOG_MESSAGES);
      return {
        serviceId,
        environmentId: productionEnvironmentId,
        level: entry.level,
        message: entry.message,
        timestamp: hoursAgo(randomInt(0, 24)),
      };
    });
    await db.insert(logs).values(logRows);
  }

  const checkoutTraceServices = ["checkout-web", "customer-api", "payments-api"];
  if (checkoutTraceServices.every((name) => serviceIdByName.has(name))) {
    const traceRows = await db
      .insert(traces)
      .values({
        traceId: randomHex(16),
        serviceId: serviceIdByName.get("checkout-web")!,
        durationMs: 480,
        startedAt: hoursAgo(1),
      })
      .returning();
    const trace = traceRows[0];
    if (trace) {
      let offset = 0;
      for (const [index, serviceName] of checkoutTraceServices.entries()) {
        const durationMs = 480 / checkoutTraceServices.length;
        await db.insert(spans).values({
          traceId: trace.id,
          serviceId: serviceIdByName.get(serviceName)!,
          name: index === 0 ? "POST /checkout" : `call ${serviceName}`,
          startedAt: new Date(trace.startedAt.getTime() + offset),
          durationMs,
        });
        offset += durationMs;
      }
    }
  }

  for (const serviceDef of SERVICES) {
    if (checkoutTraceServices.includes(serviceDef.name)) continue;
    const serviceId = serviceIdByName.get(serviceDef.name);
    if (!serviceId) continue;

    const traceRows = await db
      .insert(traces)
      .values({
        traceId: randomHex(16),
        serviceId,
        durationMs: 120,
        startedAt: hoursAgo(2),
      })
      .returning();
    const trace = traceRows[0];
    if (!trace) continue;

    await db.insert(spans).values([
      { traceId: trace.id, serviceId, name: "handle_request", startedAt: trace.startedAt, durationMs: 40 },
      {
        traceId: trace.id,
        serviceId,
        name: "query_database",
        startedAt: new Date(trace.startedAt.getTime() + 40),
        durationMs: 80,
      },
    ]);
  }

  const servicesWithErrors = SERVICES.slice(0, 4);
  for (const serviceDef of servicesWithErrors) {
    const serviceId = serviceIdByName.get(serviceDef.name);
    if (!serviceId) continue;

    await db.insert(errorEvents).values({
      serviceId,
      environmentId: productionEnvironmentId,
      type: "TimeoutError",
      message: "Request to downstream service timed out",
      occurrences: randomInt(2, 40),
      affectedUsers: randomInt(1, 25),
      firstSeenAt: hoursAgo(randomInt(48, 96)),
      lastSeenAt: hoursAgo(randomInt(0, 6)),
    });
  }

  const apiServiceNames = ["payments-api", "identity-api", "customer-api", "analytics-api"];
  const API_PROTOCOL_OVERRIDES: Record<string, "rest" | "graphql" | "grpc" | "websocket"> = {
    "identity-api": "graphql",
  };
  const API_STATUS_OVERRIDES: Record<string, "active" | "deprecated" | "retired"> = {
    "analytics-api": "deprecated",
  };
  for (const serviceName of apiServiceNames) {
    const serviceId = serviceIdByName.get(serviceName);
    const serviceDef = SERVICES.find((service) => service.name === serviceName);
    if (!serviceId || !serviceDef) continue;

    const protocol = API_PROTOCOL_OVERRIDES[serviceName] ?? "rest";
    const status = API_STATUS_OVERRIDES[serviceName] ?? "active";

    const apiRows = await db
      .insert(apis)
      .values({
        organizationId: organization.id,
        serviceId,
        teamId: teamIdByName.get(serviceDef.team),
        name: serviceName,
        slug: serviceName,
        version: "1.0.0",
        status,
        protocol,
        description: `API ${protocol.toUpperCase()} de ${serviceName}.`,
      })
      .onConflictDoNothing({ target: apis.slug })
      .returning();

    const api = apiRows[0];
    if (!api) continue;

    const resourceName = serviceName.split("-")[0];
    const isPayments = serviceName === "payments-api";
    await db.insert(apiEndpoints).values([
      { apiId: api.id, method: "GET", path: `/${resourceName}`, description: "Lista recursos" },
      {
        apiId: api.id,
        method: "POST",
        path: `/${resourceName}`,
        description: "Cria um recurso",
        requestSchema: isPayments
          ? { type: "object", required: ["amount", "currency"], properties: { amount: { type: "number" }, currency: { type: "string" } } }
          : null,
        responseSchema: isPayments
          ? { type: "object", properties: { id: { type: "string" }, status: { type: "string" } } }
          : null,
      },
    ]);

    if (serviceName === "payments-api") {
      const consumerServiceId = serviceIdByName.get("checkout-web");
      await db.insert(apiConsumers).values({
        apiId: api.id,
        name: "checkout-web",
        consumerServiceId,
      });
    }
  }

  const adminUserId = userIdByEmail.get("admin@acme.test");
  const paymentsServiceId = serviceIdByName.get("payments-api");
  const checkoutServiceId = serviceIdByName.get("checkout-web");
  await db.insert(documents).values([
    {
      organizationId: organization.id,
      authorId: adminUserId,
      title: "Getting Started",
      slug: "getting-started",
      category: "getting_started",
      content:
        "# Getting Started\n\nComo configurar o ambiente local do Nexus e rodar os services da Acme Engineering.",
    },
    {
      organizationId: organization.id,
      authorId: adminUserId,
      serviceId: paymentsServiceId,
      title: "Arquitetura de Pagamentos",
      slug: "arquitetura-de-pagamentos",
      category: "architecture",
      content:
        "# Arquitetura de Pagamentos\n\npayments-api concentra a integração com o provider de pagamento externo.",
    },
    {
      organizationId: organization.id,
      authorId: adminUserId,
      serviceId: paymentsServiceId,
      title: "Runbook: payments-api fora do ar",
      slug: "runbook-payments-api-fora-do-ar",
      category: "runbooks",
      content:
        "# Runbook: payments-api fora do ar\n\n1. Verificar dashboard de Observability do serviço.\n2. Checar status do provider de pagamento externo.\n3. Se necessário, acionar rollback do último deployment.",
    },
    {
      organizationId: organization.id,
      authorId: adminUserId,
      serviceId: checkoutServiceId,
      title: "Runbook: checkout-web com erro elevado",
      slug: "runbook-checkout-web-erro-elevado",
      category: "runbooks",
      content:
        "# Runbook: checkout-web com erro elevado\n\n1. Consultar Errors em Observability agrupados por tipo.\n2. Confirmar se payments-api está saudável (é a principal dependência).\n3. Abrir um incidente se a taxa de erro persistir acima de 5%.",
    },
    {
      organizationId: organization.id,
      authorId: adminUserId,
      title: "Padrões de Engenharia",
      slug: "padroes-de-engenharia",
      category: "engineering_standards",
      content:
        "# Padrões de Engenharia\n\nTypeScript strict em todo lugar, autorização sempre no backend e testes cobrindo loading/empty/error/success.",
    },
  ]);

  await db.insert(adrs).values([
    {
      organizationId: organization.id,
      title: "Escolha de mensageria para notifications-worker",
      status: "accepted",
      context: "notifications-worker precisava de uma fila confiável para processar notificações assíncronas.",
      decision: "Adotar Redis + BullMQ para a fila de notificações.",
      consequences: "Requer um Redis disponível em todos os ambientes; simplifica retries e backoff.",
      alternatives: "SQS (descartado por acoplar a AWS), RabbitMQ (descartado por overhead operacional maior).",
    },
    {
      organizationId: organization.id,
      title: "identity-api migra de REST para GraphQL",
      status: "proposed",
      context: "Consumidores internos frequentemente precisam de combinações diferentes de campos de usuário/permissões, gerando endpoints REST sob medida.",
      decision: "Expor um schema GraphQL único para identity-api, mantendo REST em modo deprecated durante a transição.",
      consequences: "Consumidores precisam migrar suas integrações; observability de GraphQL exige tratamento diferente de erros por operação.",
      alternatives: "Manter REST e adicionar endpoints agregadores (descartado por perpetuar o problema de N endpoints sob medida).",
    },
  ]);

  for (const flag of FEATURE_FLAGS) {
    const flagRows = await db
      .insert(featureFlags)
      .values({
        organizationId: organization.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        enabled: flag.enabled,
      })
      .onConflictDoNothing({ target: [featureFlags.organizationId, featureFlags.key] })
      .returning();
    const featureFlag = flagRows[0];
    if (!featureFlag) continue;

    if (flag.rules.length > 0) {
      await db.insert(featureFlagRules).values(
        flag.rules.map((rule, index) => ({
          featureFlagId: featureFlag.id,
          kind: rule.kind,
          value: rule.value,
          order: index,
        })),
      );
    }
  }

  return { organization };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function stageStatusFor(
  stageIndex: number,
  failStageIndex: number,
): "success" | "failed" | "skipped" {
  if (failStageIndex === stageIndex) return "failed";
  if (failStageIndex !== -1 && stageIndex > failStageIndex) return "skipped";
  return "success";
}

function stageLogsFor(name: string, status: "success" | "failed" | "skipped"): string | null {
  if (status === "skipped") return null;
  if (status === "failed") {
    return `$ run ${name.toLowerCase().replace(/\s+/g, "-")}\n✗ ${name} failed\nError: stage exited with a non-zero status code`;
  }
  return `$ run ${name.toLowerCase().replace(/\s+/g, "-")}\n✓ ${name} passed`;
}
