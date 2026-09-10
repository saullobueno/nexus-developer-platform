import type { ApiDetail } from "../../../lib/apis";

function SchemaBlock({ label, schema }: { label: string; schema: unknown }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {schema ? (
        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(schema, null, 2)}
        </pre>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Sem schema definido.</p>
      )}
    </div>
  );
}

export function SchemaTab({ detail }: { detail: ApiDetail }) {
  if (detail.endpoints.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum endpoint para explorar schemas.</p>;
  }

  return (
    <div className="space-y-4">
      {detail.endpoints.map((endpoint) => (
        <div key={endpoint.id} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-medium uppercase">
              {endpoint.method}
            </span>
            <span className="font-mono">{endpoint.path}</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SchemaBlock label="Request" schema={endpoint.requestSchema} />
            <SchemaBlock label="Response" schema={endpoint.responseSchema} />
          </div>
        </div>
      ))}
    </div>
  );
}
