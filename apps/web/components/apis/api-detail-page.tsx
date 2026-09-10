"use client";

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui";
import Link from "next/link";
import { useApiDetail } from "../../hooks/use-api-detail";
import { ActivityTab } from "./tabs/activity-tab";
import { ConsumersTab } from "./tabs/consumers-tab";
import { DocumentationTab } from "./tabs/documentation-tab";
import { EndpointsTab } from "./tabs/endpoints-tab";
import { HealthTab } from "./tabs/health-tab";
import { OverviewTab } from "./tabs/overview-tab";
import { SchemaTab } from "./tabs/schema-tab";

export function ApiDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useApiDetail(slug);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando API...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar esta API.</p>
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
          <Link href="/apis" className="hover:underline">
            APIs
          </Link>{" "}
          / {data.api.name}
        </nav>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.api.name}</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="consumers">Consumers</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab detail={data} />
        </TabsContent>
        <TabsContent value="endpoints">
          <EndpointsTab detail={data} />
        </TabsContent>
        <TabsContent value="schema">
          <SchemaTab detail={data} />
        </TabsContent>
        <TabsContent value="documentation">
          <DocumentationTab detail={data} />
        </TabsContent>
        <TabsContent value="consumers">
          <ConsumersTab detail={data} />
        </TabsContent>
        <TabsContent value="health">
          <HealthTab detail={data} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab detail={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
