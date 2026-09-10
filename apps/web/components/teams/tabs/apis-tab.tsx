import Link from "next/link";
import type { TeamDetail } from "../../../lib/teams";

export function ApisTab({ detail }: { detail: TeamDetail }) {
  if (detail.apis.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma API vinculada a este time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.apis.map((api) => (
        <li key={api.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <Link href={`/apis/${api.slug}`} className="font-medium hover:underline">
            {api.name}
          </Link>
          <span className="text-xs uppercase text-muted-foreground">{api.protocol}</span>
        </li>
      ))}
    </ul>
  );
}
