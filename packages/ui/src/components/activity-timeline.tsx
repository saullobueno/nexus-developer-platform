export interface ActivityTimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
}

export interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  emptyMessage?: string;
}

export function ActivityTimeline({
  items,
  emptyMessage = "Nenhuma atividade registrada.",
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-4 border-l pl-4">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">{item.title}</p>
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
          <p className="text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleString("pt-BR")}
          </p>
        </li>
      ))}
    </ol>
  );
}
