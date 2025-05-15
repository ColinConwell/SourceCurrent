import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { EndpointList, EndpointData } from "./endpoint-list";
import { EndpointResult } from "./endpoint-result";
import { ServiceSelector } from "./service-selector";
import axios from "axios";

type ServiceType = "slack" | "notion" | "github" | "linear";

export function EndpointExplorer() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(null);
  const [resultView, setResultView] = useState<"treeview" | "json">("treeview");
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Get services that are available in the environment
  const { data: servicesData } = useQuery({
    queryKey: ["/api/environment/services"],
  });
  
  const services = servicesData?.data?.availableServices
    ? Object.keys(servicesData.data.availableServices).filter(
        (service) => servicesData.data.availableServices[service]
      )
    : [];

  // Get endpoints for the selected service
  const { data: endpointsData, isLoading: isLoadingEndpoints } = useQuery({
    queryKey: ["/api/endpoints", selectedService],
    enabled: !!selectedService,
    select: (data) => {
      return getEndpointsForService(selectedService as ServiceType);
    }
  });
  
  // Execute the selected endpoint
  const executeEndpoint = async () => {
    if (!selectedEndpoint) return;
    
    setIsExecuting(true);
    setResultData(null);
    
    try {
      const response = await axios.get(selectedEndpoint.endpoint);
      setResultData(response.data);
    } catch (error) {
      console.error("Error executing endpoint:", error);
      setResultData({ error: "Failed to execute endpoint" });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Reset the form
  const reset = () => {
    setSelectedEndpoint(null);
    setResultData(null);
  };

  const handleEndpointSelect = (endpoint: EndpointData) => {
    setSelectedEndpoint(endpoint);
    setResultData(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>API Endpoint Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedService ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100">
                  {selectedService === "slack" && <i className="ri-slack-line text-xl text-primary-600"></i>}
                  {selectedService === "notion" && <i className="ri-file-list-line text-xl text-primary-600"></i>}
                  {selectedService === "github" && <i className="ri-github-fill text-xl text-primary-600"></i>}
                  {selectedService === "linear" && <i className="ri-line-chart-line text-xl text-primary-600"></i>}
                </div>
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedService}</h3>
                  <p className="text-sm text-neutral-500">API Endpoints</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedService(null)}>
                Change Service
              </Button>
            </div>
          ) : (
            <ServiceSelector 
              services={services} 
              selectedService={selectedService}
              onSelectService={(service: string) => {
                setSelectedService(service as ServiceType);
                reset();
              }}
            />
          )}
        </CardContent>
      </Card>

      {selectedService && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              {isLoadingEndpoints ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-neutral-600">Loading endpoints...</p>
                  </div>
                </div>
              ) : (
                <EndpointList
                  endpoints={endpointsData || []}
                  selectedEndpoint={selectedEndpoint}
                  onSelectEndpoint={handleEndpointSelect}
                  isExecuting={isExecuting}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {selectedEndpoint ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{selectedEndpoint.name}</h3>
                    <p className="text-sm text-neutral-600">{selectedEndpoint.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {selectedEndpoint.endpoint}
                      </code>
                      <Button size="sm" onClick={executeEndpoint} disabled={isExecuting}>
                        {isExecuting ? "Executing..." : "Execute"}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <EndpointResult 
                    data={resultData} 
                    isLoading={isExecuting}
                    view={resultView}
                    onChangeView={setResultView}
                  />
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center text-neutral-500">
                    <div className="text-3xl mb-2">
                      <i className="ri-file-list-line"></i>
                    </div>
                    <p>No endpoint selected</p>
                    <p className="text-sm">Select an endpoint from the list to view details</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Temporary function to get endpoints for a service
// This will be replaced with an actual API call
function getEndpointsForService(service: string): EndpointData[] {
  const typedService = service as ServiceType;
  switch (service) {
    case "slack":
      return [
        {
          id: "slack-messages",
          name: "Channel Messages",
          description: "Get recent messages from a Slack channel",
          endpoint: "/api/slack/messages",
          method: "GET",
          category: "Messages",
        },
      ];
    case "notion":
      return [
        {
          id: "notion-tasks",
          name: "Tasks List",
          description: "Get tasks from a Notion database",
          endpoint: "/api/notion/tasks",
          method: "GET",
          category: "Databases",
        },
      ];
    case "github":
      return [
        {
          id: "github-repos",
          name: "Repositories",
          description: "Get a list of GitHub repositories",
          endpoint: "/api/github/repositories",
          method: "GET",
          category: "Repositories",
        },
        {
          id: "github-repo-details",
          name: "Repository Details",
          description: "Get details about a specific GitHub repository",
          endpoint: "/api/github/repositories/facebook/react",
          method: "GET",
          category: "Repositories",
        },
      ];
    case "linear":
      return [
        {
          id: "linear-teams",
          name: "Teams",
          description: "Get a list of Linear teams",
          endpoint: "/api/linear/teams",
          method: "GET",
          category: "Teams",
        },
        {
          id: "linear-workflow-states",
          name: "Workflow States",
          description: "Get workflow states from Linear",
          endpoint: "/api/linear/workflow-states",
          method: "GET",
          category: "Workflows",
        }
      ];
    default:
      return [];
  }
}