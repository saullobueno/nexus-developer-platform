import type { ReactNode } from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  helpText?: ReactNode;
}

export function MetricCard({ label, value, unit, helpText }: MetricCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {helpText && <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
