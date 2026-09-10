import { Controller, Sse, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { RealtimeEventBusService } from "./realtime-event-bus.service";

@Controller("realtime")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RealtimeController {
  constructor(private readonly eventBus: RealtimeEventBusService) {}

  @Sse("events")
  @RequirePermissions("services:read")
  events(@CurrentUser() user: AuthenticatedUser) {
    return this.eventBus.streamFor(user.organizationId);
  }
}
