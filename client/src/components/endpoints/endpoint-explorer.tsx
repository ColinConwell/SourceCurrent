import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EndpointList } from "./endpoint-list";
import { EndpointResult } from "./endpoint-result";
import { ServiceSelector } from "./service-selector";

// Types for our endpoint explorer
type ServiceType = "slack" | "notion" | "github" | "linear";
type EndpointData = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  category: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
};

export function EndpointExplorer() {
  // State for the selected service and endpoint
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointData | null>(null);
  const [endpointResult, setEndpointResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"treeview" | "json">("treeview");
  
  // Fetch available services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/environment/services'],
    select: (response) => response.data.availableServices
  });
  
  // Fetch endpoints for the selected service
  const { data: endpoints, isLoading: isLoadingEndpoints } = useQuery({
    queryKey: ['/api/endpoints', selectedService],
    enabled: !!selectedService,
    // Mock this until we have a real endpoint
    queryFn: async () => {
      // This is temporary until we implement the backend endpoint
      // We'll just return hardcoded endpoints based on the service
      return getEndpointsForService(selectedService as ServiceType);
    }
  });
  
  // Execute the selected endpoint
  const executeEndpoint = async () => {
    if (!selectedEndpoint) return;
    
    setIsLoading(true);
    try {
      // Build the URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}${selectedEndpoint.endpoint}`;
      
      // Execute the API call
      const response = await fetch(url);
      const data = await response.json();
      
      setEndpointResult(data);
    } catch (error) {
      console.error("Error executing endpoint:", error);
      setEndpointResult({ error: "Failed to execute endpoint. See console for details." });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the UI state
  const reset = () => {
    setSelectedEndpoint(null);
    setEndpointResult(null);
  };
  
  return (
    <div className="space-y-8">
      {/* Service Selection */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Select a Service</h2>
          
          {isLoadingServices ? (
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : (
            <ServiceSelector 
              services={services} 
              selectedService={selectedService}
              onSelectService={(service) => {
                setSelectedService(service as ServiceType);
                reset();
              }}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Endpoint Selection */}
      {selectedService && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Available Endpoints</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedService(null)}
              >
                Change Service
              </Button>
            </div>
            
            {isLoadingEndpoints ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <EndpointList 
                endpoints={endpoints || []} 
                selectedEndpoint={selectedEndpoint}
                onSelectEndpoint={setSelectedEndpoint}
              />
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Endpoint Result */}
      {selectedEndpoint && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-medium">{selectedEndpoint.name}</h2>
                <p className="text-sm text-neutral-500">{selectedEndpoint.description}</p>
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={reset}
                >
                  Reset
                </Button>
                <Button 
                  onClick={executeEndpoint}
                  disabled={isLoading}
                >
                  {isLoading ? "Executing..." : "Execute"}
                </Button>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-md mb-6">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">API Request</h3>
              <div className="font-mono text-sm bg-neutral-100 p-3 rounded-md overflow-x-auto">
                <code>
                  {selectedEndpoint.method} {window.location.origin}{selectedEndpoint.endpoint}
                </code>
              </div>
            </div>
            
            {endpointResult && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Response</h3>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "treeview" | "json")}>
                    <TabsList>
                      <TabsTrigger value="treeview">Tree View</TabsTrigger>
                      <TabsTrigger value="json">Raw JSON</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <EndpointResult 
                  data={endpointResult} 
                  isLoading={isLoading}
                  view={activeTab} 
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Temporary function to get endpoints for a service
// This will be replaced with an actual API call
function getEndpointsForService(service: ServiceType): EndpointData[] {
  switch (service) {
    case "slack":
      return [
        {
          id: "slack-messages",
          name: "Get Channel Messages",
          description: "Retrieve recent messages from a Slack channel",
          method: "GET",
          endpoint: "/api/slack/messages",
          category: "Messages"
        },
        {
          id: "slack-channels",
          name: "List Channels",
          description: "Get a list of all channels in the workspace",
          method: "GET",
          endpoint: "/api/slack/channels",
          category: "Channels"
        },
        {
          id: "slack-users",
          name: "List Users",
          description: "Get a list of all users in the workspace",
          method: "GET",
          endpoint: "/api/slack/users",
          category: "Users"
        }
      ];
    case "notion":
      return [
        {
          id: "notion-databases",
          name: "List Databases",
          description: "Get a list of databases in the Notion workspace",
          method: "GET",
          endpoint: "/api/notion/databases",
          category: "Databases"
        },
        {
          id: "notion-tasks",
          name: "Get Tasks",
          description: "Retrieve tasks from the Notion tasks database",
          method: "GET",
          endpoint: "/api/notion/tasks",
          category: "Tasks"
        }
      ];
    case "github":
      return [
        {
          id: "github-repos",
          name: "List Repositories",
          description: "Get a list of GitHub repositories",
          method: "GET",
          endpoint: "/api/github/repositories",
          category: "Repositories"
        },
        {
          id: "github-user",
          name: "User Info",
          description: "Get the GitHub user information",
          method: "GET",
          endpoint: "/api/github/user",
          category: "User"
        }
      ];
    case "linear":
      return [
        {
          id: "linear-teams",
          name: "List Teams",
          description: "Get a list of teams in the Linear workspace",
          method: "GET",
          endpoint: "/api/linear/teams",
          category: "Teams"
        },
        {
          id: "linear-workflow-states",
          name: "Workflow States",
          description: "Get a list of workflow states",
          method: "GET",
          endpoint: "/api/linear/workflow-states",
          category: "Workflow"
        }
      ];
    default:
      return [];
  }
}