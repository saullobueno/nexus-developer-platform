import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { addIncidentEventSchema, type AddIncidentEventDto } from "./dto/add-incident-event.dto";
import { createIncidentSchema, type CreateIncidentDto } from "./dto/create-incident.dto";
import { listIncidentsSchema, type ListIncidentsQuery } from "./dto/list-incidents.dto";
import { updateIncidentSchema, type UpdateIncidentDto } from "./dto/update-incident.dto";
import { IncidentsService } from "./incidents.service";

@Controller("incidents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @RequirePermissions("incidents:read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listIncidentsSchema)) query: ListIncidentsQuery,
  ) {
    return this.incidentsService.list(user.organizationId, query);
  }

  @Get(":id")
  @RequirePermissions("incidents:read")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.incidentsService.getById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions("incidents:create")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createIncidentSchema)) dto: CreateIncidentDto,
  ) {
    return this.incidentsService.create(user.organizationId, user, dto);
  }

  @Patch(":id")
  @RequirePermissions("incidents:update")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateIncidentSchema)) dto: UpdateIncidentDto,
  ) {
    return this.incidentsService.update(user.organizationId, user, id, dto);
  }

  @Post(":id/events")
  @RequirePermissions("incidents:update")
  addEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addIncidentEventSchema)) dto: AddIncidentEventDto,
  ) {
    return this.incidentsService.addEvent(user.organizationId, user, id, dto);
  }
}
