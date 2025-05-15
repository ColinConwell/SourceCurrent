import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceDataViewer } from "@/components/data-display/service-data-viewer";
import { ServiceMetadataViewer } from "@/components/data-display/service-metadata-viewer";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Connection {
  id: number;
  name: string;
  serviceType: string;
  [key: string]: any;
}

interface DataSource {
  sourceId: string;
  label: string;
  [key: string]: any;
}

export function IntegrationDataExplorer() {
  const [selectedTab, setSelectedTab] = useState("metadata");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  
  const { data: connectionsResponse, isLoading: isLoadingConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });
  
  const connections = connectionsResponse || [];
  
  // Auto-select first connection if none selected and connections are loaded
  React.useEffect(() => {
    if (connections.length > 0 && !selectedService) {
      setSelectedService(connections[0].id.toString());
    }
  }, [connections, selectedService]);
  
  const { data: dataSources, isLoading: isLoadingDataSources } = useQuery<DataSource[]>({
    queryKey: ["/api/connections", selectedService, "data-sources"],
    enabled: !!selectedService,
  });
  
  // Auto-select first data source if none selected and data sources are loaded
  React.useEffect(() => {
    if (dataSources && dataSources.length > 0 && !selectedDataSource) {
      setSelectedDataSource(dataSources[0].sourceId);
    }
  }, [dataSources, selectedDataSource]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Data Explorer</CardTitle>
        <CardDescription>
          Explore metadata and raw data from your connected services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger key="metadata-tab" value="metadata">Metadata</TabsTrigger>
            <TabsTrigger key="data-tab" value="data">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent key="metadata-content" value="metadata" className="space-y-4 pt-4">
            <ServiceMetadataViewer />
          </TabsContent>
          
          <TabsContent key="data-content" value="data" className="space-y-4 pt-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  Service Connection
                </label>
                {isLoadingConnections ? (
                  <div className="flex items-center h-10 px-3 py-2 text-sm border rounded-md">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <Select
                    value={selectedService?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedService(value);
                      setSelectedDataSource(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((connection: any) => (
                        <SelectItem 
                          key={connection.id} 
                          value={connection.id.toString()}
                        >
                          {connection.name} ({connection.serviceType})
                        </SelectItem>
                      ))}
                      {connections.length === 0 && (
                        <SelectItem key="no-connections" value="none" disabled>
                          No connections available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  Data Source
                </label>
                {isLoadingDataSources || !selectedService ? (
                  <div className="flex items-center h-10 px-3 py-2 text-sm border rounded-md">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedService ? "Loading..." : "Select a service first"}
                  </div>
                ) : (
                  <Select
                    value={selectedDataSource || ""}
                    onValueChange={setSelectedDataSource}
                    disabled={!dataSources?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources?.map((source: any) => (
                        <SelectItem 
                          key={source.sourceId} 
                          value={source.sourceId}
                        >
                          {source.label}
                        </SelectItem>
                      ))}
                      {(!dataSources || dataSources.length === 0) && (
                        <SelectItem key="no-datasources" value="none" disabled>
                          No data sources available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            {selectedService && selectedDataSource && (
              <ServiceDataViewer 
                connectionId={parseInt(selectedService)}
                sourceId={selectedDataSource}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}