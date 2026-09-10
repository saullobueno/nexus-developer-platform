"use client";

import { Badge, Button } from "@nexus/ui";
import Link from "next/link";
import { useAdrDetail } from "../../hooks/use-adr-detail";

const STATUS_VARIANT: Record<string, "success" | "outline" | "warning"> = {
  accepted: "success",
  proposed: "outline",
  deprecated: "warning",
  superseded: "warning",
};

function Section({ title, content }: { title: string; content: string | null }) {
  if (!content) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{content}</p>
    </div>
  );
}

export function AdrDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useAdrDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando ADR...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar esta ADR.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/docs/adrs" className="hover:underline">
            ADRs
          </Link>{" "}
          / {data.title}
        </nav>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
          <Badge variant={STATUS_VARIANT[data.status] ?? "outline"}>{data.status}</Badge>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <Section title="Context" content={data.context} />
        <Section title="Decision" content={data.decision} />
        <Section title="Consequences" content={data.consequences} />
        <Section title="Alternatives" content={data.alternatives} />
      </div>
    </div>
  );
}
