import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { EndpointList, EndpointData } from "./endpoint-list";
import { EndpointResult } from "./endpoint-result";
import { ServiceSelector } from "./service-selector";
import { cn } from "@/lib/utils";
import axios from "axios";

type ServiceType = "slack" | "notion" | "github" | "linear";

export function EndpointExplorer() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(null);
  const [resultView, setResultView] = useState<"treeview" | "json">("treeview");
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

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
      let queryParams = {};
      
      // Handle parameters that need to be substituted in the URL path
      if (selectedEndpoint.params && selectedEndpoint.params.length > 0) {
        const missingRequiredParams = selectedEndpoint.params
          .filter((p: {name: string, required: boolean}) => 
            p.required && (!paramValues[p.name] || paramValues[p.name].trim() === '')
          );
        
        if (missingRequiredParams.length > 0) {
          setResultData({
            error: "Missing required parameters",
            details: `Please provide values for: ${missingRequiredParams.map((p: {name: string}) => p.name).join(', ')}`
          });
          setIsExecuting(false);
          return;
        }
        
        // Replace path parameters with actual values
        selectedEndpoint.params.forEach((param: {name: string, type: string}) => {
          if (paramValues[param.name]) {
            // If the parameter is part of the URL path
            if (endpoint.includes(`:${param.name}`)) {
              endpoint = endpoint.replace(`:${param.name}`, encodeURIComponent(paramValues[param.name]));
            } else {
              // Otherwise, add it as a query parameter
              queryParams = {
                ...queryParams,
                [param.name]: paramValues[param.name]
              };
            }
          }
        });
      }
      
      // Special case handling for endpoints that require additional processing
      
      // GitHub repository details endpoint with parameters
      if (selectedEndpoint.id === "github-repo-details") {
        if (!paramValues.owner || !paramValues.repo) {
          // Use default values if not provided
          endpoint = "/api/github/repositories/facebook/react";
        }
      }
      
      // Linear team issues endpoint with parameters
      if (selectedEndpoint.id === "linear-team-issues") {
        if (!paramValues.teamId) {
          // Get the first team ID from the Linear teams endpoint first
          const teamsResponse = await axios.get("/api/linear/teams");
          if (teamsResponse.data && teamsResponse.data.success && teamsResponse.data.data && teamsResponse.data.data.length > 0) {
            const teamId = teamsResponse.data.data[0].id;
            endpoint = `/api/linear/teams/${teamId}/issues`;
          } else {
            throw new Error("No Linear teams found to get issues for");
          }
        }
      }
      
      // Notion tasks endpoint with parameters
      if (selectedEndpoint.id === "notion-tasks") {
        if (!paramValues.databaseId) {
          // At this point we would need a database ID, which we don't have
          // We'll show a message to the user instead
          setResultData({
            error: "This endpoint requires a Notion database ID parameter. In a real application, you would select this from a list of available databases."
          });
          setIsExecuting(false);
          return;
        }
      }
      
      // Execute the API call with any query parameters
      const response = await axios.get(endpoint, { params: queryParams });
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
    setParamValues({});
    setShowCurl(false);
  };

  const handleEndpointSelect = (endpoint: EndpointData) => {
    setSelectedEndpoint(endpoint);
    setResultData(null);
    // Clear previous parameter values when selecting a new endpoint
    setParamValues({});
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
        <div className="space-y-6">
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
                      
                      <div className="flex items-center mt-2">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Badge className={cn(
                              selectedEndpoint.method === "GET" && "bg-green-100 text-green-800",
                              selectedEndpoint.method === "POST" && "bg-blue-100 text-blue-800",
                              selectedEndpoint.method === "PUT" && "bg-yellow-100 text-yellow-800",
                              selectedEndpoint.method === "DELETE" && "bg-red-100 text-red-800"
                            )}>
                              {selectedEndpoint.method}
                            </Badge>
                            <code className="text-xs bg-neutral-100 px-2 py-1 rounded ml-2">
                              {selectedEndpoint.endpoint}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Parameter Form */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Parameters</h4>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setShowCurl(!showCurl)}>
                            {showCurl ? "Hide CURL" : "Show CURL"}
                          </Button>
                          <Button size="sm" onClick={executeEndpoint} disabled={isExecuting}>
                            {isExecuting ? "Executing..." : "Execute"}
                          </Button>
                        </div>
                      </div>
                      
                      {showCurl && (
                        <div className="bg-neutral-900 text-white p-3 rounded-md text-xs overflow-x-auto">
                          <pre className="font-mono">
                            {`curl -X ${selectedEndpoint.method} "${window.location.origin}${selectedEndpoint.endpoint}"`}
                          </pre>
                        </div>
                      )}
                      
                      {selectedEndpoint.params && selectedEndpoint.params.length > 0 ? (
                        <div className="space-y-3">
                          {selectedEndpoint.params.map((param: {
                            name: string;
                            type: string;
                            required: boolean;
                            description: string;
                          }) => (
                            <div key={param.name} className="space-y-1">
                              <label className="text-sm font-medium flex items-center">
                                {param.name}
                                {param.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm"
                                placeholder={param.description}
                                value={paramValues[param.name] || ''}
                                onChange={(e) => setParamValues(prev => ({
                                  ...prev,
                                  [param.name]: e.target.value
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-neutral-50 rounded-md">
                          <p className="text-sm text-neutral-500">
                            This endpoint does not require any parameters.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
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
          
          {/* Results Panel */}
          {selectedEndpoint && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EndpointResult 
                  data={resultData} 
                  isLoading={isExecuting}
                  view={resultView}
                  onChangeView={setResultView}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

