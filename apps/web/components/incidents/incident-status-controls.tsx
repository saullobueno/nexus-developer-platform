"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIncident } from "../../lib/incidents";

const STATUS_OPTIONS = ["investigating", "identified", "monitoring", "resolved"];
const SEVERITY_OPTIONS = ["sev1", "sev2", "sev3", "sev4"];

export function IncidentStatusControls({
  incidentId,
  status,
  severity,
}: {
  incidentId: string;
  status: string;
  severity: string;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: { status?: string; severity?: string }) =>
      updateIncident(incidentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incidents", "detail", incidentId] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        Status
        <select
          value={status}
          onChange={(event) => mutation.mutate({ status: event.target.value })}
          disabled={mutation.isPending}
          className="h-9 rounded-md border border-input bg-background px-2"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Severity
        <select
          value={severity}
          onChange={(event) => mutation.mutate({ severity: event.target.value })}
          disabled={mutation.isPending}
          className="h-9 rounded-md border border-input bg-background px-2"
        >
          {SEVERITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      {mutation.isError && <span className="text-destructive">Não foi possível salvar.</span>}
    </div>
  );
}
