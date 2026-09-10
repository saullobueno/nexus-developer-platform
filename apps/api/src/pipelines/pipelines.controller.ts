import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listPipelinesSchema, type ListPipelinesQuery } from "./dto/list-pipelines.dto";
import { listRunsSchema, type ListRunsQuery } from "./dto/list-runs.dto";
import { PipelinesService } from "./pipelines.service";

@Controller("pipelines")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("deployments:read")
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listPipelinesSchema)) query: ListPipelinesQuery,
  ) {
    return this.pipelinesService.list(user.organizationId, query);
  }

  @Get("runs/:runId")
  getRunById(@CurrentUser() user: AuthenticatedUser, @Param("runId") runId: string) {
    return this.pipelinesService.getRunById(user.organizationId, runId);
  }

  @Get(":id")
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Query(new ZodValidationPipe(listRunsSchema)) query: ListRunsQuery,
  ) {
    return this.pipelinesService.getById(user.organizationId, id, query);
  }
}
