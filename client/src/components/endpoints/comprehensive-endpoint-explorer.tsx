import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Clock, Globe, ShieldCheck, Zap, RefreshCw, Code, Play, ChevronRight, ChevronDown } from "lucide-react";
import axios from "axios";

type ServiceType = "slack" | "notion" | "github" | "linear" | "gdrive";

interface EndpointParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
  example?: any;
}

interface DiscoveredEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category: string;
  subcategory?: string;
  params?: EndpointParameter[];
  authentication?: string;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export function ComprehensiveEndpointExplorer() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DiscoveredEndpoint | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Get comprehensive endpoint discovery data
  const { 
    data: endpointData, 
    isLoading: endpointsLoading, 
    refetch: refetchEndpoints,
    error: endpointsError 
  } = useQuery({
    queryKey: ['/api/endpoints'],
  });

  // Get available services info
  const { data: servicesData } = useQuery({
    queryKey: ['/api/environment/services'],
  });

  const availableServices = (servicesData as any)?.data?.availableServices || {};

  // Get discovered endpoints for selected service
  const endpoints = React.useMemo(() => {
    if (!selectedService || !(endpointData as any)?.data?.endpoints) return [];
    return (endpointData as any).data.endpoints[selectedService] || [];
  }, [selectedService, endpointData]);

  // Get service information
  const serviceInfo = (endpointData as any)?.data?.services?.[selectedService || ''] || null;

  // Group endpoints by category
  const endpointsByCategory = React.useMemo(() => {
    const groups: Record<string, DiscoveredEndpoint[]> = {};
    endpoints.forEach((endpoint: DiscoveredEndpoint) => {
      const category = endpoint.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(endpoint);
    });
    return groups;
  }, [endpoints]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const executeEndpoint = async () => {
    if (!selectedEndpoint) return;

    setIsExecuting(true);
    try {
      let url = selectedEndpoint.endpoint;
      const queryParams: Record<string, string> = {};

      // Handle path parameters and query parameters
      if (selectedEndpoint.params) {
        selectedEndpoint.params.forEach(param => {
          const value = paramValues[param.name];
          if (value) {
            if (url.includes(`:${param.name}`)) {
              // Path parameter
              url = url.replace(`:${param.name}`, encodeURIComponent(value));
            } else {
              // Query parameter
              queryParams[param.name] = value;
            }
          }
        });
      }

      const response = await axios.get(url, { params: queryParams });
      setResultData(response.data);
    } catch (error: any) {
      console.error('Error executing endpoint:', error);
      setResultData({
        error: true,
        message: error.response?.data?.message || error.message || 'Request failed',
        status: error.response?.status
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setSelectedEndpoint(null);
    setResultData(null);
    setParamValues({});
  };

  const handleEndpointSelect = (endpoint: DiscoveredEndpoint) => {
    setSelectedEndpoint(endpoint);
    setResultData(null);
    setParamValues({});
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'slack': return '💬';
      case 'notion': return '📝';
      case 'github': return '🐙';
      case 'linear': return '📈';
      case 'gdrive': return '📁';
      default: return '🔗';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Endpoints Explorer</h2>
          <p className="text-muted-foreground">
            Discover and test endpoints from your connected integrations
          </p>
        </div>
        <Button 
          onClick={() => refetchEndpoints()} 
          disabled={endpointsLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", endpointsLoading && "animate-spin")} />
          Refresh Discovery
        </Button>
      </div>

      {endpointsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Failed to discover endpoints. Please check your service connections and try again.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Service Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Connected Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {endpointsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              Object.keys(availableServices).filter(service => 
                availableServices[service] && endpointData?.data?.endpoints?.[service]?.length > 0
              ).map((service) => (
                <Button
                  key={service}
                  variant={selectedService === service ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleServiceSelect(service as ServiceType)}
                >
                  <span className="mr-2">{getServiceIcon(service)}</span>
                  <span className="capitalize">{service}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {endpointData?.data?.endpoints?.[service]?.length || 0}
                  </Badge>
                </Button>
              ))
            )}
            
            {endpointData?.data?.totalEndpoints && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Total: {endpointData.data.totalEndpoints} endpoints discovered
                </p>
                {endpointData.data.discoveredAt && (
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Last updated: {new Date(endpointData.data.discoveredAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoint List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              {selectedService ? (
                <>
                  <span className="mr-2">{getServiceIcon(selectedService)}</span>
                  <span className="capitalize">{selectedService} Endpoints</span>
                </>
              ) : (
                'Select a Service'
              )}
            </CardTitle>
            {serviceInfo && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>API Version:</strong> {serviceInfo.version}</p>
                <p><strong>Base URL:</strong> {serviceInfo.baseUrl}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedService ? (
              <p className="text-muted-foreground text-center py-8">
                Select a service to view available endpoints
              </p>
            ) : endpoints.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No endpoints discovered for this service
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(endpointsByCategory).map(([category, categoryEndpoints]) => (
                  <div key={category}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => toggleCategory(category)}
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-medium">{category}</span>
                      <Badge variant="outline" className="ml-auto">
                        {categoryEndpoints.length}
                      </Badge>
                    </Button>
                    
                    {expandedCategories.has(category) && (
                      <div className="ml-6 space-y-2 mt-2">
                        {categoryEndpoints.map((endpoint) => (
                          <div
                            key={endpoint.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedEndpoint?.id === endpoint.id
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => handleEndpointSelect(endpoint)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{endpoint.name}</h4>
                              <Badge className={cn("text-xs", getMethodColor(endpoint.method))}>
                                {endpoint.method}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {endpoint.description}
                            </p>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {endpoint.endpoint}
                            </code>
                            {endpoint.subcategory && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {endpoint.subcategory}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoint Details & Execution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Test Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedEndpoint ? (
              <p className="text-muted-foreground text-center py-8">
                Select an endpoint to test
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{selectedEndpoint.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedEndpoint.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <Badge className={getMethodColor(selectedEndpoint.method)}>
                        {selectedEndpoint.method}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Endpoint:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {selectedEndpoint.endpoint}
                      </code>
                    </div>
                    {selectedEndpoint.authentication && (
                      <div className="flex justify-between">
                        <span>Auth:</span>
                        <Badge variant="outline" className="text-xs">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {selectedEndpoint.authentication}
                        </Badge>
                      </div>
                    )}
                    {selectedEndpoint.rateLimit && (
                      <div className="flex justify-between">
                        <span>Rate Limit:</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {selectedEndpoint.rateLimit.requests}/{selectedEndpoint.rateLimit.window}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3">Parameters</h5>
                    <div className="space-y-3">
                      {selectedEndpoint.params.map((param) => (
                        <div key={param.name}>
                          <Label className="text-sm flex items-center gap-2">
                            {param.name}
                            {param.required && <span className="text-red-500">*</span>}
                            <Badge variant="outline" className="text-xs">
                              {param.type}
                            </Badge>
                          </Label>
                          <Input
                            placeholder={param.example ? String(param.example) : param.description}
                            value={paramValues[param.name] || ''}
                            onChange={(e) => setParamValues(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={executeEndpoint}
                  disabled={isExecuting}
                  className="w-full"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Request
                    </>
                  )}
                </Button>

                {resultData && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Response</h5>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-96 overflow-auto">
                      <pre className="text-xs">
                        {JSON.stringify(resultData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}