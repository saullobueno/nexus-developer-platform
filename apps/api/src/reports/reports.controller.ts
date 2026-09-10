import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { getReportsSchema, type GetReportsQuery } from "./dto/get-reports.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("reports:read")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(getReportsSchema)) query: GetReportsQuery,
  ) {
    return this.reportsService.get(user.organizationId, query);
  }
}
