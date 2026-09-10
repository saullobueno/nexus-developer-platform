import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listFeatureFlagsSchema, type ListFeatureFlagsQuery } from "./dto/list-feature-flags.dto";
import { updateRulesSchema, type UpdateRulesInput } from "./dto/update-rules.dto";
import { FeatureFlagsService } from "./feature-flags.service";

@Controller("feature-flags")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @RequirePermissions("feature_flags:read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listFeatureFlagsSchema)) query: ListFeatureFlagsQuery,
  ) {
    return this.featureFlagsService.list(user.organizationId, query);
  }

  @Get(":key")
  @RequirePermissions("feature_flags:read")
  getByKey(@CurrentUser() user: AuthenticatedUser, @Param("key") key: string) {
    return this.featureFlagsService.getByKey(user.organizationId, key);
  }

  @Patch(":key/toggle")
  @RequirePermissions("feature_flags:update")
  toggle(@CurrentUser() user: AuthenticatedUser, @Param("key") key: string) {
    return this.featureFlagsService.toggle(user.organizationId, key, user);
  }

  @Put(":key/rules")
  @RequirePermissions("feature_flags:update")
  updateRules(
    @CurrentUser() user: AuthenticatedUser,
    @Param("key") key: string,
    @Body(new ZodValidationPipe(updateRulesSchema)) body: UpdateRulesInput,
  ) {
    return this.featureFlagsService.updateRules(user.organizationId, key, user, body);
  }
}
