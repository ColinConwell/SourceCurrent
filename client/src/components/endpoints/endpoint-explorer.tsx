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
  const { data: servicesData } = useQuery<{
    success: boolean;
    data: {
      availableServices: Record<string, boolean>;
    };
  }>({
    queryKey: ["/api/environment/services"],
  });
  
  const services = servicesData?.data?.availableServices
    ? Object.keys(servicesData.data.availableServices).filter(
        (service) => servicesData.data.availableServices[service]
      )
    : [];

  // Get endpoints for the selected service
  const { data: endpointsData, isLoading: isLoadingEndpoints } = useQuery<
    { success: boolean; data: Record<string, EndpointData[]>; }, 
    Error,
    EndpointData[]
  >({
    queryKey: ["/api/endpoints"],
    enabled: !!selectedService,
    select: (data) => {
      if (data && data.success && data.data && selectedService) {
        return data.data[selectedService] || [];
      }
      return [];
    }
  });
  
  // Execute the selected endpoint
  const executeEndpoint = async () => {
    if (!selectedEndpoint) return;
    
    setIsExecuting(true);
    setResultData(null);
    
    try {
      // For endpoints with parameters in the path, we need to handle them
      let endpoint = selectedEndpoint.endpoint;
      
      // GitHub repository details endpoint with parameters
      if (selectedEndpoint.id === "github-repo-details") {
        endpoint = "/api/github/repositories/facebook/react"; // Default example
      }
      
      // Linear team issues endpoint with parameters
      if (selectedEndpoint.id === "linear-team-issues") {
        // Get the first team ID from the Linear teams endpoint first
        const teamsResponse = await axios.get("/api/linear/teams");
        if (teamsResponse.data && teamsResponse.data.success && teamsResponse.data.data && teamsResponse.data.data.length > 0) {
          const teamId = teamsResponse.data.data[0].id;
          endpoint = `/api/linear/teams/${teamId}/issues`;
        } else {
          throw new Error("No Linear teams found to get issues for");
        }
      }
      
      // Notion tasks endpoint with parameters
      if (selectedEndpoint.id === "notion-tasks") {
        // At this point we would need a database ID, which we don't have
        // We'll show a message to the user instead
        setResultData({
          error: "This endpoint requires a Notion database ID parameter. In a real application, you would select this from a list of available databases."
        });
        setIsExecuting(false);
        return;
      }
      
      const response = await axios.get(endpoint);
      setResultData(response.data);
    } catch (error: any) {
      console.error("Error executing endpoint:", error);
      setResultData({ 
        error: "Failed to execute endpoint", 
        message: error.message,
        details: error.response?.data || "No additional details available"
      });
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

