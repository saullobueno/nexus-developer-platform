import { Badge } from "@nexus/ui";
import { useAiRuns } from "../../hooks/use-ai-runs";

export function RunsHistory({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const { data, isLoading } = useAiRuns();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando histórico...
      </p>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma pergunta feita ainda.</p>;
  }

  return (
    <ul className="space-y-1">
      {data.map((run) => (
        <li key={run.id}>
          <button
            type="button"
            onClick={() => onSelect(run.id)}
            className={`w-full rounded-md border px-3 py-2 text-left text-xs hover:bg-accent/50 ${
              selectedId === run.id ? "border-primary" : ""
            }`}
          >
            <p className="truncate font-medium">{run.summary ?? "…"}</p>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Badge variant={run.status === "requires_approval" ? "warning" : "outline"}>{run.status}</Badge>
              <span>{new Date(run.startedAt).toLocaleString("pt-BR")}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
