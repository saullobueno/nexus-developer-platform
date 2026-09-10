import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { DeploymentsService } from "./deployments.service";
import { listDeploymentsSchema, type ListDeploymentsQuery } from "./dto/list-deployments.dto";

@Controller("deployments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  @RequirePermissions("deployments:read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listDeploymentsSchema)) query: ListDeploymentsQuery,
  ) {
    return this.deploymentsService.list(user.organizationId, query);
  }

  @Get(":id")
  @RequirePermissions("deployments:read")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deploymentsService.getById(user.organizationId, id);
  }

  @Post(":id/cancel")
  @RequirePermissions("deployments:rollback")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deploymentsService.cancel(user.organizationId, user, id);
  }

  @Post(":id/retry")
  @RequirePermissions("deployments:rollback")
  retry(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deploymentsService.retry(user.organizationId, user, id);
  }

  @Post(":id/rollback")
  @RequirePermissions("deployments:rollback")
  rollback(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deploymentsService.rollback(user.organizationId, user, id);
  }
}
