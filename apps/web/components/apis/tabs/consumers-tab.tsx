import Link from "next/link";
import type { ApiDetail } from "../../../lib/apis";

export function ConsumersTab({ detail }: { detail: ApiDetail }) {
  if (detail.consumers.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum consumidor registrado para esta API.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.consumers.map((consumer) => (
        <li key={consumer.id} className="px-4 py-3 text-sm">
          {consumer.consumerServiceSlug ? (
            <Link href={`/catalog/services/${consumer.consumerServiceSlug}`} className="font-medium hover:underline">
              {consumer.name}
            </Link>
          ) : (
            <span className="font-medium">{consumer.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
