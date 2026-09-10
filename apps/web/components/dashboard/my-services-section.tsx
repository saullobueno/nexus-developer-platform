import { Badge } from "@nexus/ui";
import type { DashboardSummary } from "../../lib/dashboard";

interface MyServicesSectionProps {
  services: DashboardSummary["myServices"];
}

export function MyServicesSection({ services }: MyServicesSectionProps) {
  return (
    <section className="rounded-lg border">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">My Services</h2>
      </header>
      {services.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Você ainda não é dono nem faz parte do time de nenhum serviço.
        </p>
      ) : (
        <ul className="divide-y">
          {services.map((service) => (
            <li key={service.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{service.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{service.type}</Badge>
                <Badge variant="secondary">{service.lifecycle}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
