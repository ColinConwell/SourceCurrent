import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JsonTreeViewer } from './json-tree-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';

interface ServiceDataViewerProps {
  connectionId?: number;
  sourceId?: string;
  title?: string;
  className?: string;
}

export function ServiceDataViewer({
  connectionId,
  sourceId,
  title = "Data View",
  className
}: ServiceDataViewerProps) {
  const [activeTab, setActiveTab] = useState<'tree' | 'raw'>('tree');
  
  // Query to fetch data for the connection/data source
  const {
    data: sourceData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<any>({
    queryKey: ['/api/connections', connectionId, 'data', { sourceId }],
    enabled: !!connectionId,
  });
  
  if (!connectionId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Select a connection and data source to view the data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'tree' | 'raw')}
            className="mr-2"
          >
            <TabsList className="h-8">
              <TabsTrigger value="tree" className="text-xs px-3 py-1.5">
                Tree View
              </TabsTrigger>
              <TabsTrigger value="raw" className="text-xs px-3 py-1.5">
                Raw JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-8 px-2"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading data...</span>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            <h4 className="font-medium">Error Loading Data</h4>
            <p className="text-sm mt-1">{error?.message || 'Failed to fetch data. Please try again.'}</p>
          </div>
        ) : !sourceData?.data ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No data available for this source.</p>
          </div>
        ) : (
          <TabsContent value="tree" className="mt-0 p-0" forceMount hidden={activeTab !== 'tree'}>
            <JsonTreeViewer
              data={sourceData.data}
              maxInitialDepth={2}
            />
          </TabsContent>
        )}
        
        {sourceData?.data && (
          <TabsContent value="raw" className="mt-0 p-0" forceMount hidden={activeTab !== 'raw'}>
            <div className="border rounded-lg p-4 overflow-auto max-h-[600px]">
              <pre className="text-xs font-mono text-muted-foreground">
                {JSON.stringify(sourceData.data, null, 2)}
              </pre>
            </div>
          </TabsContent>
        )}
      </CardContent>
    </Card>
  );
}