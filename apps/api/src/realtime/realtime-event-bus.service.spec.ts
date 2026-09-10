import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";
import { RealtimeEventBusService } from "./realtime-event-bus.service";

describe("RealtimeEventBusService", () => {
  it("entrega eventos apenas para a organização correspondente (object-level authorization)", async () => {
    const bus = new RealtimeEventBusService();
    const received = firstValueFrom(bus.streamFor("org-a"));

    bus.emit({ organizationId: "org-b", type: "incident.created", data: { id: "wrong-org" } });
    bus.emit({ organizationId: "org-a", type: "incident.created", data: { id: "correct-org" } });

    const message = await received;
    expect(JSON.parse(message.data as string)).toEqual({
      type: "incident.created",
      data: { id: "correct-org" },
    });
  });

  it("serializa type e data em JSON no campo data do MessageEvent", async () => {
    const bus = new RealtimeEventBusService();
    const received = firstValueFrom(bus.streamFor("org-a"));

    bus.emit({
      organizationId: "org-a",
      type: "deployment.completed",
      data: { id: "d1", serviceName: "payments-api", version: "1.4.0", status: "successful" },
    });

    const message = await received;
    expect(JSON.parse(message.data as string)).toEqual({
      type: "deployment.completed",
      data: { id: "d1", serviceName: "payments-api", version: "1.4.0", status: "successful" },
    });
  });
});
