import { cn } from "../lib/utils";

export interface ServiceDependencyNode {
  id: string;
  name: string;
  isExternal?: boolean;
}

export interface ServiceDependencyGraphProps {
  service: string;
  dependencies: ServiceDependencyNode[];
  dependents?: ServiceDependencyNode[];
}

export function ServiceDependencyGraph({
  service,
  dependencies,
  dependents = [],
}: ServiceDependencyGraphProps) {
  if (dependencies.length === 0 && dependents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma dependência mapeada.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      {dependents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {dependents.map((node) => (
            <span key={node.id} className="rounded-md border px-2 py-1">
              {node.name}
            </span>
          ))}
          <span className="text-muted-foreground" aria-hidden="true">
            →
          </span>
          <span className="rounded-md border border-primary px-2 py-1 font-medium">{service}</span>
        </div>
      )}
      {dependencies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-primary px-2 py-1 font-medium">{service}</span>
          <span className="text-muted-foreground" aria-hidden="true">
            →
          </span>
          {dependencies.map((node) => (
            <span
              key={node.id}
              className={cn(
                "rounded-md border px-2 py-1",
                node.isExternal && "border-dashed text-muted-foreground",
              )}
            >
              {node.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
