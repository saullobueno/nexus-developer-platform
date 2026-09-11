"use client";

import { Switch } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeatureFlagDetail, ListFeatureFlagsResult } from "../../lib/feature-flags";
import { toggleFeatureFlag } from "../../lib/feature-flags";

type CachedFlagsData = ListFeatureFlagsResult | FeatureFlagDetail;

function flipCachedFlag(data: CachedFlagsData, flagKey: string): CachedFlagsData {
  if ("items" in data) {
    return {
      ...data,
      items: data.items.map((item) => (item.key === flagKey ? { ...item, enabled: !item.enabled } : item)),
    };
  }
  if (data.flag.key === flagKey) {
    return { ...data, flag: { ...data.flag, enabled: !data.flag.enabled } };
  }
  return data;
}

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleFeatureFlag(flagKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feature-flags"] });
      const previous = queryClient.getQueriesData<CachedFlagsData>({ queryKey: ["feature-flags"] });
      queryClient.setQueriesData<CachedFlagsData>({ queryKey: ["feature-flags"] }, (data) =>
        data ? flipCachedFlag(data, flagKey) : data,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
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
