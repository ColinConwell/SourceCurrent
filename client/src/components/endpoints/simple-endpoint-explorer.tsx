import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function SimpleEndpointExplorer() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Get endpoint discovery data
  const { data: endpointData, isLoading } = useQuery({
    queryKey: ['/api/endpoints'],
  });

  const endpoints = (endpointData as any)?.data?.endpoints || {};
  const services = (endpointData as any)?.data?.services || {};
  const totalEndpoints = (endpointData as any)?.data?.totalEndpoints || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Endpoints Discovery</h2>
          <p className="text-muted-foreground">
            Comprehensive endpoint detection from your connected integrations
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {totalEndpoints} endpoints discovered
        </Badge>
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
                            <div key={endpoint.id} className="border rounded p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{endpoint.name}</h5>
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