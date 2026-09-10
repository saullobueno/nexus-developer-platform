import Link from "next/link";
import type { FeatureFlagListItem } from "../../lib/feature-flags";
import { FlagToggle } from "./flag-toggle";

export function FeatureFlagsDataTable({ data }: { data: FeatureFlagListItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Flag</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Type</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Updated</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Enabled</th>
        </tr>
      </thead>
      <tbody>
        {data.map((flag) => (
          <tr key={flag.id} className="border-b last:border-0 hover:bg-accent/50">
            <td className="px-4 py-3">
              <Link href={`/feature-flags/${flag.key}`} className="font-medium hover:underline">
                {flag.name}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">{flag.key}</p>
            </td>
            <td className="px-4 py-3">{flag.type}</td>
            <td className="px-4 py-3">{new Date(flag.updatedAt).toLocaleDateString("pt-BR")}</td>
            <td className="px-4 py-3">
              <FlagToggle flagKey={flag.key} enabled={flag.enabled} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
