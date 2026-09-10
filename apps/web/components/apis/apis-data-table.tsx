import { Badge } from "@nexus/ui";
import Link from "next/link";
import type { ApiListItem } from "../../lib/apis";

export function ApisDataTable({ data }: { data: ApiListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">API</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Protocol</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Version</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Owner</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Service</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((api) => (
          <tr key={api.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link href={`/apis/${api.slug}`} className="font-medium hover:underline">
                {api.name}
              </Link>
            </td>
            <td className="px-4 py-3 uppercase">{api.protocol}</td>
            <td className="px-4 py-3">{api.version}</td>
            <td className="px-4 py-3">{api.teamName ?? "—"}</td>
            <td className="px-4 py-3">
              {api.serviceSlug ? (
                <Link href={`/catalog/services/${api.serviceSlug}`} className="hover:underline">
                  {api.serviceName}
                </Link>
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3">
              <Badge variant={api.status === "active" ? "success" : "outline"}>{api.status}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
