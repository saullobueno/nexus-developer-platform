export interface TraceWaterfallSpan {
  id: string;
  name: string;
  serviceName: string;
  startedAt: string;
  durationMs: number;
}

export interface TraceWaterfallProps {
  spans: TraceWaterfallSpan[];
}

export function TraceWaterfall({ spans }: TraceWaterfallProps) {
  if (spans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum span registrado para este trace.</p>
    );
  }

  const startTimes = spans.map((span) => new Date(span.startedAt).getTime());
  const start = Math.min(...startTimes);
  const totalDuration = Math.max(
    ...spans.map((span) => new Date(span.startedAt).getTime() - start + span.durationMs),
    1,
  );

  return (
    <div className="space-y-2">
      {spans.map((span) => {
        const offsetMs = new Date(span.startedAt).getTime() - start;
        const leftPercent = (offsetMs / totalDuration) * 100;
        const widthPercent = Math.max((span.durationMs / totalDuration) * 100, 1);

        return (
          <div key={span.id} className="flex items-center gap-3 text-xs">
            <span className="w-40 shrink-0 truncate text-muted-foreground">
              {span.serviceName} · {span.name}
            </span>
            <div className="relative h-4 flex-1 rounded bg-muted">
              <div
                className="absolute top-0 h-4 rounded bg-primary"
                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-muted-foreground">
              {Math.round(span.durationMs)}ms
            </span>
          </div>
        );
      })}
    </div>
  );
}
