import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type ServiceType = "slack" | "notion" | "github" | "linear" | "gdrive";

interface EndpointData {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category?: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

export function EndpointExplorer() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultView, setResultView] = useState<"treeview" | "json">("treeview");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [showCurl, setShowCurl] = useState(false);

  // Get available services info
  const { data: servicesData } = useQuery({
    queryKey: ['/api/environment/services'],
  });

  // Get comprehensive endpoint discovery data
  const { data: endpointData, isLoading: endpointsLoading, refetch: refetchEndpoints } = useQuery({
    queryKey: ['/api/endpoints'],
  });

  const availableServices = servicesData?.data?.availableServices || {
    slack: false,
    notion: false,
    github: false,
    linear: false,
    gdrive: false,
  };

  // Get discovered endpoints for selected service
  const endpoints = React.useMemo(() => {
    if (!selectedService || !endpointData?.data?.endpoints) return [];
    return endpointData.data.endpoints[selectedService] || [];
  }, [selectedService, endpointData]);

  // Get service information
  const serviceInfo = endpointData?.data?.services?.[selectedService || ''] || null;
        return [
          {
            id: "github-repositories",
            name: "List Repositories",
            description: "Get repositories from GitHub",
            endpoint: "/api/github/repositories",
            method: "GET" as const,
          },
          {
            id: "github-repo-details",
            name: "Repository Details",
            description: "Get detailed information about a specific repository",
            endpoint: "/api/github/repositories/:owner/:repo",
            method: "GET" as const,
            params: [
              {
                name: "owner",
                type: "string",
                description: "Repository owner (username or organization)",
                required: true
              },
              {
                name: "repo",
                type: "string",
                description: "Repository name",
                required: true
              }
            ]
          }
        ];
      case "linear":
        return [
          {
            id: "linear-teams",
            name: "List Teams",
            description: "Get teams from Linear",
            endpoint: "/api/linear/teams",
            method: "GET" as const,
          },
          {
            id: "linear-team-issues",
            name: "Team Issues",
            description: "Get issues for a specific team",
            endpoint: "/api/linear/teams/:teamId/issues",
            method: "GET" as const,
            params: [
              {
                name: "teamId",
                type: "string",
                description: "Linear team ID",
                required: true
              },
              {
                name: "status",
                type: "string",
                description: "Filter by status (e.g., todo, in_progress, done)",
                required: false
              }
            ]
          },
          {
            id: "linear-workflow-states",
            name: "Workflow States",
            description: "Get all workflow states",
            endpoint: "/api/linear/workflow-states",
            method: "GET" as const,
          }
        ];
      default:
        return [];
    }
  }, [selectedService]);

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
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceSelector 
            selectedService={selectedService}
            onChange={setSelectedService}
            availableServices={availableServices}
          />
        </CardContent>
      </Card>

      {selectedService && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Endpoint List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <EndpointList 
                  endpoints={endpoints}
                  selectedEndpoint={selectedEndpoint}
                  onSelect={handleEndpointSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Endpoint Details and Execution */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{selectedEndpoint ? selectedEndpoint.name : "Endpoint Details"}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEndpoint ? (
                  <div className="space-y-6">
                    <p className="text-sm text-neutral-600">{selectedEndpoint.description}</p>
                    
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-mono",
                          selectedEndpoint.method === "GET" && "bg-blue-50 border-blue-200 text-blue-700",
                          selectedEndpoint.method === "POST" && "bg-green-50 border-green-200 text-green-700",
                          selectedEndpoint.method === "PUT" && "bg-amber-50 border-amber-200 text-amber-700",
                          selectedEndpoint.method === "DELETE" && "bg-red-50 border-red-200 text-red-700"
                        )}
                      >
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="px-2 py-1 bg-neutral-100 rounded text-xs">{selectedEndpoint.endpoint}</code>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Parameters</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCurl(!showCurl)}
                        className="text-xs"
                      >
                        {showCurl ? "Hide CURL" : "Show CURL"}
                      </Button>
                    </div>
                    
                    {showCurl && (
                      <div className="bg-neutral-900 text-neutral-100 p-3 rounded-md overflow-auto">
                        <pre className="text-xs">
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
                          This endpoint doesn't require any parameters.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={reset}>Reset</Button>
                      <Button
                        onClick={executeEndpoint}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <i className="ri-refresh-line animate-spin mr-1"></i>
                            Executing...
                          </>
                        ) : (
                          <>Execute</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-neutral-500 h-[300px]">
                    <div className="text-3xl mb-2">
                      <i className="ri-api-line"></i>
                    </div>
                    <p>Select an endpoint from the list</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {selectedEndpoint && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
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
  );
}