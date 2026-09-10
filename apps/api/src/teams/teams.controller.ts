import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listTeamsSchema, type ListTeamsQuery } from "./dto/list-teams.dto";
import { TeamsService } from "./teams.service";

@Controller("teams")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("teams:read")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listTeamsSchema)) query: ListTeamsQuery,
  ) {
    return this.teamsService.list(user.organizationId, query);
  }

  @Get(":slug")
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.teamsService.getBySlug(user.organizationId, slug);
  }
}
