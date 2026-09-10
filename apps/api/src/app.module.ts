import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
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
import { ReportsModule } from "./reports/reports.module";
import { ServicesModule } from "./services/services.module";
import { TeamsModule } from "./teams/teams.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CommonModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
