import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AiCopilotModule } from "./ai-copilot/ai-copilot.module";
import { ApisModule } from "./apis/apis.module";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { DeploymentsModule } from "./deployments/deployments.module";
import { DocsModule } from "./docs/docs.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { IncidentsModule } from "./incidents/incidents.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { ObservabilityModule } from "./observability/observability.module";
import { PipelinesModule } from "./pipelines/pipelines.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { ReportsModule } from "./reports/reports.module";
import { ServicesModule } from "./services/services.module";
import { SettingsModule } from "./settings/settings.module";
import { TeamsModule } from "./teams/teams.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    CommonModule,
    RealtimeModule,
    AuthModule,
    DashboardModule,
    ServicesModule,
    DeploymentsModule,
    IncidentsModule,
    ObservabilityModule,
    ApisModule,
    DocsModule,
    FeatureFlagsModule,
    PipelinesModule,
    TeamsModule,
    ReportsModule,
    IntegrationsModule,
    AiCopilotModule,
    SettingsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
