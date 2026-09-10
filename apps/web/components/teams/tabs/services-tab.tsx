import Link from "next/link";
import type { TeamDetail } from "../../../lib/teams";

export function ServicesTab({ detail }: { detail: TeamDetail }) {
  if (detail.services.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum serviço vinculado a este time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.services.map((service) => (
        <li key={service.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <Link href={`/catalog/services/${service.slug}`} className="font-medium hover:underline">
            {service.name}
          </Link>
          <span className="text-xs text-muted-foreground">{service.lifecycle}</span>
        </li>
      ))}
    </ul>
  );
}
