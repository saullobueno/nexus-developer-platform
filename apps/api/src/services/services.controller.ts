import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { listServicesSchema, type ListServicesQuery } from "./dto/list-services.dto";
import { ServicesService } from "./services.service";

@Controller("services")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @RequirePermissions("services:read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listServicesSchema)) query: ListServicesQuery,
  ) {
    return this.servicesService.list(user.organizationId, query);
  }

  @Get(":slug")
  @RequirePermissions("services:read")
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.servicesService.getBySlug(user.organizationId, slug);
  }
}
