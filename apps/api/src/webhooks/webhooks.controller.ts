import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { createWebhookSchema, type CreateWebhookInput } from "./dto/create-webhook.dto";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @RequirePermissions("settings:read")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.webhooksService.list(user.organizationId);
  }

  @Post()
  @RequirePermissions("settings:update")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWebhookSchema)) body: CreateWebhookInput,
  ) {
    return this.webhooksService.create(user.organizationId, user, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("settings:update")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.webhooksService.remove(user.organizationId, user, id);
  }
}
