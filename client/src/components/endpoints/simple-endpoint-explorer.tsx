import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Play, RefreshCw } from "lucide-react";
import axios from "axios";

export function SimpleEndpointExplorer() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Get endpoint discovery data
  const { data: endpointData, isLoading, refetch } = useQuery({
    queryKey: ['/api/endpoints'],
  });

  const endpoints = (endpointData as any)?.data?.endpoints || {};
  const services = (endpointData as any)?.data?.services || {};
  const totalEndpoints = (endpointData as any)?.data?.totalEndpoints || 0;

  const executeEndpoint = async () => {
    if (!selectedEndpoint) return;

    setIsExecuting(true);
    try {
      let url = selectedEndpoint.endpoint;
      const queryParams: Record<string, string> = {};

      // Handle path parameters and query parameters
      if (selectedEndpoint.params) {
        selectedEndpoint.params.forEach((param: any) => {
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

  const handleEndpointSelect = (endpoint: any) => {
    setSelectedEndpoint(endpoint);
    setResultData(null);
    setParamValues({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Endpoints Discovery</h2>
          <p className="text-muted-foreground">
            Comprehensive endpoint detection from your connected integrations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {totalEndpoints} endpoints discovered
          </Badge>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(endpoints).map(([service, serviceEndpoints]: [string, any]) => (
            <Card key={service} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {service === 'slack' && '💬'}
                      {service === 'notion' && '📝'}
                      {service === 'github' && '🐙'}
                      {service === 'linear' && '📈'}
                      {service === 'gdrive' && '📁'}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{service}</h3>
                      {services[service] && (
                        <p className="text-sm text-muted-foreground">
                          {services[service].name} {services[service].version}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {serviceEndpoints.length} endpoints
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {/* Group endpoints by category */}
                  {(() => {
                    const categories: Record<string, any[]> = {};
                    serviceEndpoints.forEach((endpoint: any) => {
                      const category = endpoint.category || 'General';
                      if (!categories[category]) categories[category] = [];
                      categories[category].push(endpoint);
                    });

                    return Object.entries(categories).map(([category, categoryEndpoints]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                          {category}
                          <Badge variant="outline">{categoryEndpoints.length}</Badge>
                        </h4>
                        <div className="grid gap-3">
                          {categoryEndpoints.map((endpoint: any) => (
                            <div 
                              key={endpoint.id} 
                              className={`border rounded p-3 cursor-pointer transition-colors ${
                                selectedEndpoint?.id === endpoint.id 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={() => handleEndpointSelect(endpoint)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{endpoint.name}</h5>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={
                                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {endpoint.method}
                                  </Badge>
                                  {selectedEndpoint?.id === endpoint.id && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        executeEndpoint();
                                      }}
                                      disabled={isExecuting}
                                      className="ml-2"
                                    >
                                      {isExecuting ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Play className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {endpoint.description}
                              </p>
                              <code className="text-xs bg-white px-2 py-1 rounded border">
                                {endpoint.endpoint}
                              </code>
                              
                              {/* Show additional details */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {endpoint.subcategory && (
                                  <Badge variant="outline" className="text-xs">
                                    {endpoint.subcategory}
                                  </Badge>
                                )}
                                {endpoint.authentication && (
                                  <Badge variant="outline" className="text-xs">
                                    🔐 {endpoint.authentication}
                                  </Badge>
                                )}
                                {endpoint.rateLimit && (
                                  <Badge variant="outline" className="text-xs">
                                    ⏱️ {endpoint.rateLimit.requests}/{endpoint.rateLimit.window}
                                  </Badge>
                                )}
                                {endpoint.params && endpoint.params.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    📝 {endpoint.params.length} params
                                  </Badge>
                                )}
                              </div>

                              {/* Parameter inputs for selected endpoint */}
                              {selectedEndpoint?.id === endpoint.id && endpoint.params && endpoint.params.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="font-medium mb-3 text-sm">Parameters</h6>
                                  <div className="space-y-3">
                                    {endpoint.params.map((param: any) => (
                                      <div key={param.name}>
                                        <Label className="text-xs flex items-center gap-2">
                                          {param.name}
                                          {param.required && <span className="text-red-500">*</span>}
                                          <Badge variant="outline" className="text-xs">
                                            {param.type}
                                          </Badge>
                                        </Label>
                                        <Input
                                          size="sm"
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

                              {/* Results for selected endpoint */}
                              {selectedEndpoint?.id === endpoint.id && resultData && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="font-medium mb-2 text-sm">Response</h6>
                                  <div className="bg-white rounded border p-3 max-h-64 overflow-auto">
                                    <pre className="text-xs">
                                      {JSON.stringify(resultData, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalEndpoints > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Endpoint Discovery Complete!
              </h3>
              <p className="text-green-700">
                Successfully discovered {totalEndpoints} endpoints across {Object.keys(endpoints).length} connected services.
                Each endpoint includes detailed parameter specifications, authentication requirements, and rate limiting information.
              </p>
              {(endpointData as any)?.data?.discoveredAt && (
                <p className="text-sm text-green-600 mt-2">
                  Last updated: {new Date((endpointData as any).data.discoveredAt).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}