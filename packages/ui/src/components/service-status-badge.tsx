import { Badge, type BadgeProps } from "./badge";
import type { HealthStatus } from "./health-indicator";

const HEALTH_VARIANT: Record<HealthStatus, BadgeProps["variant"]> = {
  healthy: "success",
  degraded: "warning",
  unhealthy: "destructive",
  unknown: "outline",
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
  unknown: "Unknown",
};

export interface ServiceStatusBadgeProps {
  status: HealthStatus;
}

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps) {
  return <Badge variant={HEALTH_VARIANT[status]}>{HEALTH_LABEL[status]}</Badge>;
}
