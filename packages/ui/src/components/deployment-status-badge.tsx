import { Badge, type BadgeProps } from "./badge";

export type DeploymentStatus =
  | "queued"
  | "running"
  | "successful"
  | "failed"
  | "cancelled"
  | "rolled_back";

const STATUS_VARIANT: Record<DeploymentStatus, BadgeProps["variant"]> = {
  queued: "outline",
  running: "secondary",
  successful: "success",
  failed: "destructive",
  cancelled: "outline",
  rolled_back: "warning",
};

const STATUS_LABEL: Record<DeploymentStatus, string> = {
  queued: "Queued",
  running: "Running",
  successful: "Successful",
  failed: "Failed",
  cancelled: "Cancelled",
  rolled_back: "Rolled back",
};

export interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
}

export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
