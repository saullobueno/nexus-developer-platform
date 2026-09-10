"use client";

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui";
import Link from "next/link";
import { useServiceDetail } from "../../hooks/use-service-detail";
import { ActivityTab } from "./tabs/activity-tab";
import { ApiTab } from "./tabs/api-tab";
import { DependenciesTab } from "./tabs/dependencies-tab";
import { DeploymentsTab } from "./tabs/deployments-tab";
import { DocumentationTab } from "./tabs/documentation-tab";
import { EnvironmentsTab } from "./tabs/environments-tab";
import { IncidentsTab } from "./tabs/incidents-tab";
import { ObservabilityTab } from "./tabs/observability-tab";
import { OverviewTab } from "./tabs/overview-tab";

export function ServiceDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useServiceDetail(slug);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando serviço...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este serviço.</p>
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
          <Link href="/catalog" className="hover:underline">
            Catalog
          </Link>{" "}
          / Services / {data.service.name}
        </nav>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.service.name}</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="observability">Observability</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab detail={data} />
        </TabsContent>
        <TabsContent value="deployments">
          <DeploymentsTab detail={data} />
        </TabsContent>
        <TabsContent value="environments">
          <EnvironmentsTab detail={data} />
        </TabsContent>
        <TabsContent value="observability">
          <ObservabilityTab detail={data} />
        </TabsContent>
        <TabsContent value="api">
          <ApiTab detail={data} />
        </TabsContent>
        <TabsContent value="dependencies">
          <DependenciesTab detail={data} />
        </TabsContent>
        <TabsContent value="documentation">
          <DocumentationTab detail={data} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab detail={data} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab detail={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
