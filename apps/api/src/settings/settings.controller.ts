import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listAuditLogsSchema, type ListAuditLogsQuery } from "./dto/list-audit-logs.dto";
import { updateMemberRoleSchema, type UpdateMemberRoleInput } from "./dto/update-member-role.dto";
import { updateOrganizationSchema, type UpdateOrganizationInput } from "./dto/update-organization.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("organization")
  @RequirePermissions("settings:read")
  getOrganization(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getOrganization(user.organizationId);
  }

  @Patch("organization")
  @RequirePermissions("settings:update")
  updateOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) body: UpdateOrganizationInput,
  ) {
    return this.settingsService.updateOrganization(user.organizationId, user, body);
  }

  @Get("members")
  @RequirePermissions("settings:read")
  listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.listMembers(user.organizationId);
  }

  @Patch("members/:userId/role")
  @RequirePermissions("settings:update")
  updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: UpdateMemberRoleInput,
  ) {
    return this.settingsService.updateMemberRole(user.organizationId, user, userId, body);
  }

  @Get("roles")
  @RequirePermissions("settings:read")
  listRoles() {
    return this.settingsService.listRoles();
  }

  @Get("environments")
  @RequirePermissions("settings:read")
  listEnvironments(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.listEnvironments(user.organizationId);
  }

  @Get("audit-logs")
  @RequirePermissions("settings:read")
  listAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listAuditLogsSchema)) query: ListAuditLogsQuery,
  ) {
    return this.settingsService.listAuditLogs(user.organizationId, query);
  }
}
