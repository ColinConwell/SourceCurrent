import React from "react";
import AppLayout from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationDashboard } from "@/components/dashboard/integration-dashboard";
import { IntegrationDataExplorer } from "@/components/integrations/integration-data-explorer";
import { ConnectionManager } from "@/components/integrations/connection-manager";

export default function IntegrationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Integrations"
          description="Manage and explore your connected service integrations"
          icon="ri-link-m"
        />

        <div className="space-y-8">
          <ConnectionManager />
          <IntegrationDashboard />
          <IntegrationDataExplorer />
        </div>
      </div>
    </AppLayout>
  );
}