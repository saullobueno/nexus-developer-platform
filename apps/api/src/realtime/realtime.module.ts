import { Global, Module } from "@nestjs/common";
import { RealtimeController } from "./realtime.controller";
import { RealtimeEventBusService } from "./realtime-event-bus.service";

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [RealtimeEventBusService],
  exports: [RealtimeEventBusService],
})
export class RealtimeModule {}
