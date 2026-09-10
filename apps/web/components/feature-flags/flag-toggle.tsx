"use client";

import { Switch } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFeatureFlag } from "../../lib/feature-flags";

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleFeatureFlag(flagKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={enabled}
        disabled={mutation.isPending}
        onCheckedChange={() => mutation.mutate()}
        aria-label={enabled ? "Desativar flag" : "Ativar flag"}
      />
      {mutation.isError && <span className="text-xs text-destructive">Não foi possível alterar</span>}
    </div>
  );
}
