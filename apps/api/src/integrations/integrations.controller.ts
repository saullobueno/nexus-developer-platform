import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { upsertIntegrationSchema, type UpsertIntegrationInput } from "./dto/upsert-integration.dto";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @RequirePermissions("settings:read")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.list(user.organizationId);
  }

  @Put(":provider")
  @RequirePermissions("settings:update")
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param("provider") provider: string,
    @Body(new ZodValidationPipe(upsertIntegrationSchema)) body: UpsertIntegrationInput,
  ) {
    return this.integrationsService.upsert(user.organizationId, user, provider, body);
  }

  @Post(":provider/test")
  @RequirePermissions("settings:update")
  testConnection(@CurrentUser() user: AuthenticatedUser, @Param("provider") provider: string) {
    return this.integrationsService.testConnection(user.organizationId, provider);
  }
}
