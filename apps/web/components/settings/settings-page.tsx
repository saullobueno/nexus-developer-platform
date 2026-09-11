"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui";
import { AuditLogsTab } from "./audit-logs-tab";
import { EnvironmentsTab } from "./environments-tab";
import { IntegrationsTab } from "./integrations-tab";
import { MembersTab } from "./members-tab";
import { OrganizationTab } from "./organization-tab";
import { RolesTab } from "./roles-tab";
import { WebhooksTab } from "./webhooks-tab";

export function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Organization, Members, Roles, Environments, Integrations, Webhooks e Audit Logs
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList className="flex-wrap">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
        <TabsContent value="environments">
          <EnvironmentsTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
        <TabsContent value="audit-logs">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
