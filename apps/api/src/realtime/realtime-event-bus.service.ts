import { Injectable, type MessageEvent } from "@nestjs/common";
import { filter, map, Subject, type Observable } from "rxjs";

export type RealtimeEventType =
  | "deployment.started"
  | "deployment.updated"
  | "deployment.completed"
  | "incident.created"
  | "incident.updated"
  | "incident.resolved";

export interface RealtimeEvent<T = unknown> {
  organizationId: string;
  type: RealtimeEventType;
  data: T;
}

/**
 * Event bus in-process (RxJS Subject) para os eventos tipados da spec seção 28.
 * Funciona para uma única instância do backend — se o Nexus rodar com múltiplas
 * réplicas, isso precisaria virar um pub/sub distribuído (Redis), mas não há
 * job/fila real hoje que justifique introduzir Redis (ver CLAUDE.md).
 */
@Injectable()
export class RealtimeEventBusService {
  private readonly subject = new Subject<RealtimeEvent>();

  emit<T>(event: RealtimeEvent<T>): void {
    this.subject.next(event);
  }

  streamFor(organizationId: string): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      filter((event) => event.organizationId === organizationId),
      map((event) => ({ data: JSON.stringify({ type: event.type, data: event.data }) })),
    );
  }
}
