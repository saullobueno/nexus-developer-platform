import { Badge } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function ApiTab({ detail }: { detail: ServiceDetail }) {
  if (detail.apis.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma API vinculada a este serviço.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.apis.map((api) => (
        <li key={api.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{api.name}</p>
            <p className="text-xs uppercase text-muted-foreground">{api.protocol}</p>
          </div>
          <Badge variant={api.status === "active" ? "success" : "outline"}>{api.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
