import { Badge } from "@nexus/ui";
import Link from "next/link";
import type { ApiDetail } from "../../../lib/apis";

export function OverviewTab({ detail }: { detail: ApiDetail }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Protocol</p>
        <p className="mt-1 font-medium uppercase">{detail.api.protocol}</p>
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Version</p>
        <p className="mt-1 font-medium">{detail.api.version}</p>
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Status</p>
        <Badge className="mt-1" variant={detail.api.status === "active" ? "success" : "outline"}>
          {detail.api.status}
        </Badge>
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <p className="text-xs text-muted-foreground">Owner</p>
        <p className="mt-1 font-medium">{detail.team?.name ?? "—"}</p>
      </div>
      <div className="rounded-lg border p-4 text-sm sm:col-span-2">
        <p className="text-xs text-muted-foreground">Service</p>
        <p className="mt-1 font-medium">
          {detail.service ? (
            <Link href={`/catalog/services/${detail.service.slug}`} className="hover:underline">
              {detail.service.name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>
      {detail.api.description && (
        <div className="rounded-lg border p-4 text-sm sm:col-span-2">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="mt-1">{detail.api.description}</p>
        </div>
      )}
    </div>
  );
}
