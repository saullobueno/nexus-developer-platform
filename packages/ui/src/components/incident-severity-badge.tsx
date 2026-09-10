import { Badge, type BadgeProps } from "./badge";

export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";

const SEVERITY_VARIANT: Record<IncidentSeverity, BadgeProps["variant"]> = {
  sev1: "destructive",
  sev2: "warning",
  sev3: "secondary",
  sev4: "outline",
};

export interface IncidentSeverityBadgeProps {
  severity: IncidentSeverity;
}

export function IncidentSeverityBadge({ severity }: IncidentSeverityBadgeProps) {
  return <Badge variant={SEVERITY_VARIANT[severity]}>{severity.toUpperCase()}</Badge>;
}
