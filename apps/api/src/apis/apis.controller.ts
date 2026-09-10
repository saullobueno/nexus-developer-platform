import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ApisService } from "./apis.service";
import { listApisSchema, type ListApisQuery } from "./dto/list-apis.dto";

@Controller("apis")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApisController {
  constructor(private readonly apisService: ApisService) {}

  @Get()
  @RequirePermissions("apis:read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listApisSchema)) query: ListApisQuery,
  ) {
    return this.apisService.list(user.organizationId, query);
  }

  @Get(":slug")
  @RequirePermissions("apis:read")
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.apisService.getBySlug(user.organizationId, slug);
  }
}
