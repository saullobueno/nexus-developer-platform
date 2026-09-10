import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiCopilotService } from "./ai-copilot.service";
import { askSchema, type AskInput } from "./dto/ask.dto";

@Controller("ai-copilot")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post("ask")
  @RequirePermissions("ai_copilot:use")
  ask(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(askSchema)) body: AskInput) {
    return this.aiCopilotService.ask(user.organizationId, user, body);
  }

  @Get("runs")
  @RequirePermissions("ai_copilot:read")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.aiCopilotService.list(user.organizationId);
  }

  @Get("runs/:id")
  @RequirePermissions("ai_copilot:read")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.aiCopilotService.getById(user.organizationId, id);
  }

  @Post("tool-calls/:toolCallId/approve")
  @RequirePermissions("ai_copilot:use")
  approveAction(@CurrentUser() user: AuthenticatedUser, @Param("toolCallId") toolCallId: string) {
    return this.aiCopilotService.approveAction(user.organizationId, user, toolCallId);
  }
}
