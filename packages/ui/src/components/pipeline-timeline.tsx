import { cn } from "../lib/utils";

export interface PipelineTimelineStage {
  id: string;
  name: string;
  order: number;
  status: string;
}

export interface PipelineTimelineProps {
  stages: PipelineTimelineStage[];
  emptyMessage?: string;
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500 text-white",
  failed: "bg-destructive text-white",
  running: "bg-blue-500 text-white",
  pending: "bg-muted text-muted-foreground",
  skipped: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function PipelineTimeline({
  stages,
  emptyMessage = "Sem pipeline associado.",
}: PipelineTimelineProps) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {stages.map((stage, index) => (
        <li key={stage.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                STATUS_STYLES[stage.status] ?? STATUS_STYLES.pending,
              )}
            >
              {index + 1}
            </span>
            <span className="text-xs text-muted-foreground">{stage.name}</span>
          </div>
          {index < stages.length - 1 && (
            <span className="text-muted-foreground" aria-hidden="true">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
