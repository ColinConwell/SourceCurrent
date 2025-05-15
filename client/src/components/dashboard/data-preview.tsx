import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonTreeViewer } from "@/components/data-display/json-tree-viewer";
import { Connection } from "@shared/schema";

interface DataSource {
  label: string;
  connectionId: number;
  sourceId: string;
}

export function DataPreview() {
  const [activeTab, setActiveTab] = useState<'tree' | 'raw'>('tree');
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load connections first
  const { data: connections, isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });
  
  // Then load data for the selected source
  const { 
    data: sourceData, 
    isLoading: dataLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/connections', selectedSource?.connectionId, 'data', selectedSource?.sourceId],
    enabled: !!selectedSource,
  });
  
  const handleRefresh = async () => {
    if (!selectedSource) return;
    
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Fetch connections and create data sources from auto-setup
  const dataSources = connections
    ?.filter(c => c.active)
    .map(c => {
      switch (c.service) {
        case 'slack':
          return {
            label: `${c.name} - Channel Data`,
            connectionId: c.id,
            sourceId: typeof c.credentials === 'object' && c.credentials && 'channel' in c.credentials 
              ? String(c.credentials.channel)
              : 'channel_default'
          };
        case 'linear':
          return {
            label: `${c.name} - Team Issues`,
            connectionId: c.id,
            sourceId: 'team_default'
          };
        case 'notion':
          return {
            label: `${c.name} - Tasks`,
            connectionId: c.id,
            sourceId: 'tasks'
          };
        case 'gdrive':
          return {
            label: `${c.name} - Files`,
            connectionId: c.id,
            sourceId: 'root'
          };
        default:
          return null;
      }
    })
    .filter(Boolean) as DataSource[];
  
  // Select the first source if none is selected
  if (dataSources?.length && !selectedSource && !connectionsLoading) {
    setSelectedSource(dataSources[0]);
  }
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Data Preview</h2>
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedSource?.label} 
            onValueChange={(value) => {
              const source = dataSources.find(s => s.label === value);
              if (source) setSelectedSource(source);
            }}
            disabled={connectionsLoading || dataSources?.length === 0}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a data source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources?.map((source) => (
                <SelectItem key={`${source.connectionId}-${source.sourceId}`} value={source.label}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'tree' | 'raw')}
            className="w-[200px]"
          >
            <TabsList>
              <TabsTrigger value="tree">Tree View</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !selectedSource}
          >
            {isRefreshing ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-1"></i>
                Refreshing...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-1"></i>
                Refresh
              </>
            )}
          </Button>
        </div>

        <div>
          {!selectedSource ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4">
              <i className="ri-database-2-line text-4xl mb-2"></i>
              <p>Select a data source to preview data</p>
            </div>
          ) : dataLoading || isRefreshing ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-4 m-4 rounded-md">
              <p className="font-bold">Error loading data:</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          ) : (
            <div>
              {activeTab === "tree" && (
                <div className="p-4">
                  <JsonTreeViewer 
                    data={sourceData && typeof sourceData === 'object' && 'data' in sourceData ? sourceData.data : {}} 
                    maxInitialDepth={2} 
                  />
                </div>
              )}
              
              {activeTab === "raw" && (
                <div className="p-4 overflow-auto max-h-[500px]">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(sourceData && typeof sourceData === 'object' && 'data' in sourceData ? sourceData.data : {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 bg-muted/10 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Last updated:</span>
            <span> {getLastUpdatedTime(sourceData)}</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={!sourceData}
              onClick={() => {
                if (!sourceData) return;
                
                const dataStr = JSON.stringify(sourceData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedSource?.label.replace(/\s+/g, '_').toLowerCase()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <i className="ri-download-line mr-1"></i>
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLastUpdatedTime(data: any): string {
  if (!data) return 'Never';
  
  // In a real app, this would come from the data itself or metadata
  return '2 minutes ago';
}
