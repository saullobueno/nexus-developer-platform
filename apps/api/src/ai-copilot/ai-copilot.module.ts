import { Module } from "@nestjs/common";
import { DeploymentsService } from "../deployments/deployments.service";
import { DocsService } from "../docs/docs.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import { IncidentsService } from "../incidents/incidents.service";
import { ObservabilityService } from "../observability/observability.service";
import { PipelinesService } from "../pipelines/pipelines.service";
import { ServicesService } from "../services/services.service";
import { TeamsService } from "../teams/teams.service";
import { AiCopilotController } from "./ai-copilot.controller";
import { AiCopilotService } from "./ai-copilot.service";

/**
 * Reaproveita as *Services de outros módulos diretamente como providers
 * (em vez de importar os módulos, que não as exportam) — todas dependem só
 * de DATABASE_CLIENT/AuditService/RealtimeEventBusService, que são globais
 * (DatabaseModule/CommonModule/RealtimeModule), então instanciá-las aqui é
 * seguro e não duplica rotas dos controllers de cada módulo original.
 */
@Module({
  controllers: [AiCopilotController],
  providers: [
    AiCopilotService,
    ServicesService,
    DeploymentsService,
    ObservabilityService,
    IncidentsService,
    DocsService,
    TeamsService,
    PipelinesService,
    FeatureFlagsService,
  ],
})
export class AiCopilotModule {}
