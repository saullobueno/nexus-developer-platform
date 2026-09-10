import type { ApiDetail } from "../../../lib/apis";

export function EndpointsTab({ detail }: { detail: ApiDetail }) {
  if (detail.endpoints.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum endpoint cadastrado para esta API.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.endpoints.map((endpoint) => (
        <li key={endpoint.id} className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-medium uppercase">
              {endpoint.method}
            </span>
            <span className="font-mono">{endpoint.path}</span>
          </div>
          {endpoint.description && (
            <p className="mt-1 text-xs text-muted-foreground">{endpoint.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
