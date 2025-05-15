import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EndpointExplorer } from "@/components/endpoints/endpoint-explorer";

export default function EndpointsPage() {
  const [activeTab, setActiveTab] = useState<string>("explorer");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="API Endpoints"
        description="Explore and test API endpoints from your connected services"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
          <TabsTrigger value="saved">Saved Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="explorer" className="mt-6">
          <EndpointExplorer />
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Saved Requests Yet</h3>
                <p className="text-sm text-neutral-500">
                  When you save endpoints from the explorer, they will appear here for quick access.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}