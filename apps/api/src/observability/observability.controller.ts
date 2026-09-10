import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listErrorsSchema, type ListErrorsQuery } from "./dto/list-errors.dto";
import { listLogsSchema, type ListLogsQuery } from "./dto/list-logs.dto";
import { listMetricsSchema, type ListMetricsQuery } from "./dto/list-metrics.dto";
import { listTracesSchema, type ListTracesQuery } from "./dto/list-traces.dto";
import { ObservabilityService } from "./observability.service";

@Controller("observability")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("services:read")
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get("metrics")
  getMetrics(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listMetricsSchema)) query: ListMetricsQuery,
  ) {
    return this.observabilityService.getMetrics(user.organizationId, query);
  }

  @Get("logs")
  getLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listLogsSchema)) query: ListLogsQuery,
  ) {
    return this.observabilityService.getLogs(user.organizationId, query);
  }

  @Get("traces")
  getTraces(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listTracesSchema)) query: ListTracesQuery,
  ) {
    return this.observabilityService.getTraces(user.organizationId, query);
  }

  @Get("traces/:id")
  getTraceById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.observabilityService.getTraceById(user.organizationId, id);
  }

  @Get("errors")
  getErrors(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listErrorsSchema)) query: ListErrorsQuery,
  ) {
    return this.observabilityService.getErrors(user.organizationId, query);
  }
}
