import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Connection } from "@shared/schema";

interface DataSource {
  label: string;
  connectionId: number;
  sourceId: string;
}

export function DataPreview() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'dataframe' | 'json'>('dictionary');
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
  
  // Sample data sources based on available connections
  const dataSources = connections
    ?.filter(c => c.active)
    .map(c => {
      switch (c.service) {
        case 'slack':
          return {
            label: `${c.name} - General Channel`,
            connectionId: c.id,
            sourceId: 'C01234ABCDE' // Sample channel ID
          };
        case 'linear':
          return {
            label: `${c.name} - Product Team`,
            connectionId: c.id,
            sourceId: 'team_123' // Sample team ID
          };
        case 'notion':
          return {
            label: `${c.name} - Product Roadmap`,
            connectionId: c.id,
            sourceId: 'database_456' // Sample database ID
          };
        case 'gdrive':
          return {
            label: `${c.name} - Reports`,
            connectionId: c.id,
            sourceId: 'folder_789' // Sample folder ID
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
  
  // Format the data based on the selected tab
  const formatData = () => {
    if (!sourceData) return '';
    
    switch (activeTab) {
      case 'dictionary':
      case 'json':
        return JSON.stringify(sourceData, null, 2);
      case 'dataframe':
        // In a real app, this would transform the data to a dataframe-like format
        return 'DataFrame representation would go here...';
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Data Preview</h2>
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedSource?.label} 
            onValueChange={(value) => {
              const source = dataSources.find(s => s.label === value);
              if (source) setSelectedSource(source);
            }}
            disabled={connectionsLoading || dataSources?.length === 0}
          >
            <SelectTrigger className="py-1.5 px-3 text-sm w-[240px]">
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing || !selectedSource}
          >
            <i className={`${isRefreshing ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'} text-lg`}></i>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button 
              className={`data-type-tab px-4 py-3 text-sm font-medium border-b-2 focus:outline-none ${activeTab === 'dictionary' ? 'active' : 'border-transparent'}`}
              onClick={() => setActiveTab('dictionary')}
            >
              Dictionary
            </button>
            <button 
              className={`data-type-tab px-4 py-3 text-sm font-medium border-b-2 focus:outline-none ${activeTab === 'dataframe' ? 'active' : 'border-transparent'}`}
              onClick={() => setActiveTab('dataframe')}
            >
              DataFrame
            </button>
            <button 
              className={`data-type-tab px-4 py-3 text-sm font-medium border-b-2 focus:outline-none ${activeTab === 'json' ? 'active' : 'border-transparent'}`}
              onClick={() => setActiveTab('json')}
            >
              Raw JSON
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-96">
          {!selectedSource ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
              <i className="ri-database-2-line text-4xl mb-2"></i>
              <p>Select a data source to preview data</p>
            </div>
          ) : dataLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">
              <p className="font-bold">Error loading data:</p>
              <p>{error.message}</p>
            </div>
          ) : (
            <code className="font-mono text-sm text-neutral-800 whitespace-pre">
              {formatData()}
            </code>
          )}
        </div>

        <div className="flex justify-between items-center p-4 bg-neutral-50 border-t border-neutral-200">
          <div className="text-sm text-neutral-500">
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
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing || !selectedSource}
              size="sm"
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
