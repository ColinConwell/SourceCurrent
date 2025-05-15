import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonTreeViewer } from './json-tree-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Connection } from '@shared/schema';

export function IntegrationDataExplorer() {
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get all connections
  const { data: connections, isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });
  
  // Get the integration dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isDashboardRefetching,
  } = useQuery<any>({
    queryKey: ['/api/integration/dashboard'],
  });
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchDashboard();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Get available services that have data
  const availableServices = () => {
    const services: Array<{id: string, name: string, status: string}> = [];
    
    if (dashboardData?.data?.integrationStatus) {
      Object.entries(dashboardData.data.integrationStatus).forEach(([key, value]) => {
        if (value === 'connected') {
          services.push({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            status: 'connected'
          });
        } else if (value === 'error') {
          services.push({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            status: 'error'
          });
        }
      });
    }
    
    return services;
  };
  
  // Get the data for the selected service
  const getServiceData = () => {
    if (!dashboardData?.data || !selectedService) return null;
    
    return dashboardData.data[selectedService];
  };
  
  // Services with data
  const services = availableServices();
  
  // Select the first service if none are selected
  if (services.length > 0 && !selectedService) {
    setSelectedService(services[0].id);
  }
  
  const serviceData = getServiceData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">Integration Data Explorer</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedService}
            onValueChange={setSelectedService}
            disabled={services.length === 0 || dashboardLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {/* Using a React fragment instead of a div to avoid key warning */}
                  <>
                    <span>{service.name}</span>
                    {service.status === 'connected' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 ml-1">
                        <Check className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 ml-1">
                        <AlertCircle className="w-3 h-3 mr-1" /> Limited
                      </Badge>
                    )}
                  </>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dashboardLoading || isDashboardRefetching || isRefreshing}
          >
            {isRefreshing || isDashboardRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {dashboardLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : dashboardError ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div>
                <h3 className="font-medium">Error Loading Integration Data</h3>
                <p className="text-sm mt-1">
                  {dashboardError.message || "Failed to load integration data. Please try again."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !selectedService ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Select a service to view its data.
            </p>
          </CardContent>
        </Card>
      ) : !serviceData ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No data available for {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tree">
              <TabsList className="mb-4">
                <TabsTrigger value="tree">Tree View</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tree">
                <JsonTreeViewer 
                  data={serviceData} 
                  maxInitialDepth={2}
                />
              </TabsContent>
              
              <TabsContent value="raw">
                <div className="p-4 bg-muted/10 rounded-md overflow-auto max-h-[600px]">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(serviceData, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}