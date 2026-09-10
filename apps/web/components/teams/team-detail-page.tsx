"use client";

import { Button, MetricCard, Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui";
import Link from "next/link";
import { useTeamDetail } from "../../hooks/use-team-detail";
import { ApisTab } from "./tabs/apis-tab";
import { DeploymentsTab } from "./tabs/deployments-tab";
import { DocumentationTab } from "./tabs/documentation-tab";
import { IncidentsTab } from "./tabs/incidents-tab";
import { MembersTab } from "./tabs/members-tab";
import { ServicesTab } from "./tabs/services-tab";

export function TeamDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useTeamDetail(slug);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando time...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este time.</p>
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
          <Link href="/teams" className="hover:underline">
            Teams
          </Link>{" "}
          / {data.team.name}
        </nav>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.team.name}</h1>
        {data.team.description && <p className="mt-1 text-sm text-muted-foreground">{data.team.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Services" value={data.kpis.servicesCount} />
        <MetricCard label="Deployments (30d)" value={data.kpis.deploymentsCount30d} />
        <MetricCard label="Incidents (30d)" value={data.kpis.incidentsCount30d} />
        <MetricCard label="Uptime" value={data.kpis.uptimeAvg ?? "—"} unit={data.kpis.uptimeAvg !== null ? "%" : undefined} />
        <MetricCard label="MTTR" value={data.kpis.mttrHours ?? "—"} unit={data.kpis.mttrHours !== null ? "h" : undefined} />
        <MetricCard label="Deploy frequency" value={data.kpis.deploymentFrequencyPerWeek} unit="/semana" />
      </div>

      <Tabs defaultValue="members">
        <TabsList className="flex-wrap">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab detail={data} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab detail={data} />
        </TabsContent>
        <TabsContent value="apis">
          <ApisTab detail={data} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab detail={data} />
        </TabsContent>
        <TabsContent value="deployments">
          <DeploymentsTab detail={data} />
        </TabsContent>
        <TabsContent value="documentation">
          <DocumentationTab detail={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
