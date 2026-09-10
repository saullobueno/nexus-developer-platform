import { cn } from "@nexus/ui";
import type { DeploymentLogEntry } from "../../lib/deployments";

const LEVEL_COLOR: Record<string, string> = {
  debug: "text-muted-foreground",
  info: "text-foreground",
  warn: "text-amber-600",
  error: "text-destructive",
  fatal: "text-destructive",
};

export function DeploymentLogs({ logs }: { logs: DeploymentLogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum log registrado.</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-2">
          <span className="text-muted-foreground">
            {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
          </span>
          <span className={cn("uppercase", LEVEL_COLOR[log.level] ?? "text-foreground")}>
            {log.level}
          </span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
}
