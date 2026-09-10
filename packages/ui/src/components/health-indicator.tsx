import { cn } from "../lib/utils";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

const HEALTH_CONFIG: Record<HealthStatus, { label: string; dotClassName: string }> = {
  healthy: { label: "Healthy", dotClassName: "bg-emerald-500" },
  degraded: { label: "Degraded", dotClassName: "bg-amber-500" },
  unhealthy: { label: "Unhealthy", dotClassName: "bg-destructive" },
  unknown: { label: "Unknown", dotClassName: "bg-muted-foreground" },
};

export interface HealthIndicatorProps {
  status: HealthStatus;
  className?: string;
}

export function HealthIndicator({ status, className }: HealthIndicatorProps) {
  const config = HEALTH_CONFIG[status] ?? HEALTH_CONFIG.unknown;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("size-2 rounded-full", config.dotClassName)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
