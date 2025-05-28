import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Play, RefreshCw, Download, FileText, Database } from "lucide-react";
import axios from "axios";

export function SimpleEndpointExplorer() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [resultView, setResultView] = useState<"structured" | "raw" | "tree">("structured");

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

  // Transform raw API data into structured format for AI processing
  const transformDataForAI = (data: any, endpoint: any) => {
    if (!data || data.error) return data;

    const service = selectedService;
    const endpointName = endpoint.name;
    
    try {
      switch (service) {
        case 'slack':
          if (endpoint.id === 'slack-channels') {
            return {
              dataType: 'slack_channels',
              summary: `${data.data?.channels?.length || 0} Slack channels discovered`,
              structure: {
                channels: data.data?.channels?.map((channel: any) => ({
                  id: channel.id,
                  name: channel.name,
                  is_private: channel.is_private,
                  is_archived: channel.is_archived,
                  member_count: channel.num_members,
                  purpose: channel.purpose?.value,
                  topic: channel.topic?.value
                })) || []
              },
              aiContext: {
                purpose: 'Channel structure for workspace navigation and communication analysis',
                keyFields: ['name', 'member_count', 'is_private', 'purpose'],
                useCases: ['Team organization analysis', 'Communication flow mapping', 'Channel activity insights']
              }
            };
          }
          if (endpoint.id === 'slack-messages') {
            return {
              dataType: 'slack_messages',
              summary: `${data.data?.messages?.length || 0} Slack messages retrieved`,
              structure: {
                messages: data.data?.messages?.map((msg: any) => ({
                  timestamp: msg.ts,
                  user: msg.user_info?.real_name || msg.user,
                  text: msg.text,
                  message_type: msg.type,
                  thread_ts: msg.thread_ts,
                  reactions: msg.reactions?.map((r: any) => ({ name: r.name, count: r.count })) || []
                })) || []
              },
              aiContext: {
                purpose: 'Message data for conversation analysis and team communication insights',
                keyFields: ['timestamp', 'user', 'text', 'reactions'],
                useCases: ['Sentiment analysis', 'Team collaboration patterns', 'Communication frequency tracking']
              }
            };
          }
          break;

        case 'github':
          if (endpoint.id === 'github-repos' || endpoint.id === 'github-repositories') {
            return {
              dataType: 'github_repositories',
              summary: `${data.data?.length || 0} GitHub repositories found`,
              structure: {
                repositories: data.data?.map((repo: any) => ({
                  name: repo.name,
                  full_name: repo.full_name,
                  description: repo.description,
                  language: repo.language,
                  stars: repo.stargazers_count,
                  forks: repo.forks_count,
                  issues: repo.open_issues_count,
                  created_at: repo.created_at,
                  updated_at: repo.updated_at,
                  private: repo.private,
                  size: repo.size
                })) || []
              },
              aiContext: {
                purpose: 'Repository data for development activity and codebase analysis',
                keyFields: ['name', 'language', 'stars', 'forks', 'issues'],
                useCases: ['Technology stack analysis', 'Project activity tracking', 'Code quality assessment']
              }
            };
          }
          break;

        case 'linear':
          if (endpoint.id === 'linear-teams') {
            return {
              dataType: 'linear_teams',
              summary: `${data.data?.teams?.nodes?.length || 0} Linear teams discovered`,
              structure: {
                teams: data.data?.teams?.nodes?.map((team: any) => ({
                  id: team.id,
                  name: team.name,
                  key: team.key,
                  description: team.description,
                  color: team.color,
                  states: team.states?.nodes || [],
                  labels: team.labels?.nodes || []
                })) || []
              },
              aiContext: {
                purpose: 'Team structure for project management and workflow analysis',
                keyFields: ['name', 'key', 'states', 'labels'],
                useCases: ['Team organization analysis', 'Workflow optimization', 'Project tracking']
              }
            };
          }
          if (endpoint.id === 'linear-team-issues') {
            return {
              dataType: 'linear_issues',
              summary: `${data.data?.team?.issues?.nodes?.length || 0} Linear issues found`,
              structure: {
                issues: data.data?.team?.issues?.nodes?.map((issue: any) => ({
                  identifier: issue.identifier,
                  title: issue.title,
                  description: issue.description,
                  priority: issue.priority,
                  estimate: issue.estimate,
                  state: issue.state?.name,
                  assignee: issue.assignee?.name,
                  creator: issue.creator?.name,
                  created_at: issue.createdAt,
                  updated_at: issue.updatedAt,
                  completed_at: issue.completedAt,
                  labels: issue.labels?.nodes?.map((l: any) => l.name) || []
                })) || []
              },
              aiContext: {
                purpose: 'Issue data for project progress and team productivity analysis',
                keyFields: ['identifier', 'title', 'priority', 'state', 'assignee'],
                useCases: ['Sprint planning', 'Team workload analysis', 'Project timeline tracking']
              }
            };
          }
          break;

        case 'notion':
          return {
            dataType: 'notion_data',
            summary: `Notion ${endpointName} data retrieved`,
            structure: data.data || data,
            aiContext: {
              purpose: 'Notion workspace data for knowledge management and documentation analysis',
              keyFields: ['properties', 'content', 'metadata'],
              useCases: ['Knowledge base analysis', 'Documentation tracking', 'Content organization']
            }
          };

        default:
          return {
            dataType: 'generic_api_response',
            summary: `${service} ${endpointName} data retrieved`,
            structure: data,
            aiContext: {
              purpose: 'Raw API response data',
              keyFields: Object.keys(data.data || data || {}),
              useCases: ['Data exploration', 'API testing', 'Integration development']
            }
          };
      }
    } catch (error) {
      console.error('Error transforming data:', error);
      return {
        dataType: 'transformation_error',
        error: 'Failed to transform data for AI processing',
        rawData: data
      };
    }

    return data;
  };

  // Generate tree view representation of data
  const generateTreeView = (obj: any, depth = 0): React.ReactNode => {
    if (obj === null || obj === undefined) {
      return <span className="text-gray-400">null</span>;
    }

    if (typeof obj === 'string') {
      return <span className="text-green-600">"{obj}"</span>;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return <span className="text-blue-600">{String(obj)}</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className="text-gray-400">[]</span>;
      }
      return (
        <div className={depth > 0 ? 'ml-4' : ''}>
          <span className="text-gray-600">[</span>
          {obj.slice(0, 10).map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-gray-400">{index}:</span> {generateTreeView(item, depth + 1)}
            </div>
          ))}
          {obj.length > 10 && (
            <div className="ml-4 text-gray-400">... and {obj.length - 10} more items</div>
          )}
          <span className="text-gray-600">]</span>
        </div>
      );
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <span className="text-gray-400">{"{}"}</span>;
      }
      return (
        <div className={depth > 0 ? 'ml-4' : ''}>
          <span className="text-gray-600">{"{"}</span>
          {keys.slice(0, 20).map((key) => (
            <div key={key} className="ml-4">
              <span className="text-purple-600">"{key}"</span>: {generateTreeView(obj[key], depth + 1)}
            </div>
          ))}
          {keys.length > 20 && (
            <div className="ml-4 text-gray-400">... and {keys.length - 20} more properties</div>
          )}
          <span className="text-gray-600">{"}"}</span>
        </div>
      );
    }

    return <span>{String(obj)}</span>;
  };

  const downloadStructuredData = () => {
    if (!resultData || !selectedEndpoint) return;
    
    const transformedData = transformDataForAI(resultData, selectedEndpoint);
    const dataStr = JSON.stringify(transformedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedService}_${selectedEndpoint.id}_structured_data.json`;
    link.click();
    URL.revokeObjectURL(url);
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

                              {/* Enhanced Results for selected endpoint */}
                              {selectedEndpoint?.id === endpoint.id && resultData && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="font-medium text-sm">Response Data</h6>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={downloadStructuredData}
                                        className="text-xs"
                                      >
                                        <Download className="w-3 h-3 mr-1" />
                                        Export
                                      </Button>
                                    </div>
                                  </div>

                                  <Tabs value={resultView} onValueChange={(v) => setResultView(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="structured" className="text-xs">
                                        <Database className="w-3 h-3 mr-1" />
                                        AI-Ready
                                      </TabsTrigger>
                                      <TabsTrigger value="tree" className="text-xs">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Tree View
                                      </TabsTrigger>
                                      <TabsTrigger value="raw" className="text-xs">Raw JSON</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="structured" className="mt-3">
                                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded border p-4 max-h-96 overflow-auto">
                                        {(() => {
                                          const structured = transformDataForAI(resultData, selectedEndpoint);
                                          return (
                                            <div className="space-y-4">
                                              {structured.summary && (
                                                <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                                                  <p className="font-medium text-sm text-blue-800">{structured.summary}</p>
                                                </div>
                                              )}
                                              
                                              {structured.aiContext && (
                                                <div className="bg-white rounded p-3">
                                                  <h6 className="font-medium text-xs text-gray-700 mb-2">AI Context</h6>
                                                  <div className="space-y-2 text-xs">
                                                    <p><strong>Purpose:</strong> {structured.aiContext.purpose}</p>
                                                    <p><strong>Key Fields:</strong> {structured.aiContext.keyFields.join(', ')}</p>
                                                    <p><strong>Use Cases:</strong> {structured.aiContext.useCases.join(', ')}</p>
                                                  </div>
                                                </div>
                                              )}

                                              <div className="bg-white rounded p-3">
                                                <h6 className="font-medium text-xs text-gray-700 mb-2">Structured Data</h6>
                                                <pre className="text-xs overflow-auto">
                                                  {JSON.stringify(structured.structure || structured, null, 2)}
                                                </pre>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="tree" className="mt-3">
                                      <div className="bg-gray-50 rounded border p-3 max-h-96 overflow-auto text-xs font-mono">
                                        {generateTreeView(resultData)}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="raw" className="mt-3">
                                      <div className="bg-gray-50 rounded border p-3 max-h-96 overflow-auto">
                                        <pre className="text-xs">
                                          {JSON.stringify(resultData, null, 2)}
                                        </pre>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
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