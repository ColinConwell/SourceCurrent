import React from "react";
import AppLayout from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { EndpointExplorer } from "@/components/endpoints/endpoint-explorer";

export default function Endpoints() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="API Endpoints"
          description="Explore and test API endpoints for your connected services"
          icon="ri-api-line"
        />
        
        <EndpointExplorer />
      </div>
    </AppLayout>
  );
}