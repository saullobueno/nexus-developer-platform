import { Badge } from "@nexus/ui";
import type { PipelineStageDetail } from "../../lib/pipelines";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline" | "secondary"> = {
  success: "success",
  failed: "destructive",
  running: "secondary",
  pending: "outline",
  skipped: "outline",
};

export function PipelineStagesList({ stages }: { stages: PipelineStageDetail[] }) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum stage registrado para esta execução.</p>;
  }

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{stage.name}</span>
              <Badge variant={STATUS_VARIANT[stage.status] ?? "outline"}>{stage.status}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {stage.durationMs !== null ? `${(stage.durationMs / 1000).toFixed(1)}s` : "—"}
            </span>
          </div>
          {stage.logs && (
            <pre className="mt-3 overflow-x-auto rounded bg-muted p-2 text-xs">{stage.logs}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
