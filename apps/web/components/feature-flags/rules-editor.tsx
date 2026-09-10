"use client";

import { Button, Input } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateFeatureFlagRules, type FeatureFlagRule } from "../../lib/feature-flags";

interface RuleRow {
  kind: string;
  valueText: string;
}

function toRows(rules: FeatureFlagRule[]): RuleRow[] {
  return rules.map((rule) => ({ kind: rule.kind, valueText: JSON.stringify(rule.value) }));
}

export function RulesEditor({ flagKey, rules }: { flagKey: string; rules: FeatureFlagRule[] }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<RuleRow[]>(() => toRows(rules));
  const [parseError, setParseError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (parsedRules: Array<{ kind: string; value: Record<string, unknown> }>) =>
      updateFeatureFlagRules(flagKey, { rules: parsedRules }),
    onSuccess: async (detail) => {
      setRows(toRows(detail.rules));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feature-flags", "detail", flagKey] }),
        queryClient.invalidateQueries({ queryKey: ["feature-flags"] }),
      ]);
    },
  });

  function updateRow(index: number, field: keyof RuleRow, value: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { kind: "segment", valueText: "{}" }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function handleSave() {
    setParseError(null);
    try {
      const parsed = rows.map((row) => ({ kind: row.kind, value: JSON.parse(row.valueText || "{}") }));
      mutation.mutate(parsed);
    } catch {
      setParseError("O campo 'Value' de uma das regras não é um JSON válido.");
    }
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra configurada.</p>}
      {rows.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          <Input
            aria-label="Rule kind"
            value={row.kind}
            onChange={(event) => updateRow(index, "kind", event.target.value)}
            className="w-40"
          />
          <Input
            aria-label="Rule value (JSON)"
            value={row.valueText}
            onChange={(event) => updateRow(index, "valueText", event.target.value)}
            className="flex-1 font-mono"
          />
          <Button variant="outline" size="sm" onClick={() => removeRow(index)}>
            Remover
          </Button>
        </div>
      ))}

      {parseError && <p className="text-sm text-destructive">{parseError}</p>}
      {mutation.isError && <p className="text-sm text-destructive">Não foi possível salvar as regras.</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          Adicionar regra
        </Button>
        <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar regras"}
        </Button>
      </div>
    </div>
  );
}
