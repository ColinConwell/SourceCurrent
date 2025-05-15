import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EndpointResultProps {
  data: any;
  isLoading: boolean;
  view: "treeview" | "json";
  onChangeView: (view: "treeview" | "json") => void;
}

export function EndpointResult({ data, isLoading, view, onChangeView }: EndpointResultProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>Executing request...</div>
          <Tabs value={view} onValueChange={(v) => onChangeView(v as "treeview" | "json")}>
            <TabsList className="grid w-[180px] grid-cols-2">
              <TabsTrigger value="treeview">Tree View</TabsTrigger>
              <TabsTrigger value="json">Raw JSON</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <div className="text-3xl mb-2">
            <i className="ri-article-line"></i>
          </div>
          <p>No data to display yet.</p>
          <p className="text-sm">Click the Execute button to see results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {data.error ? (
            <div className="text-red-500">Error occurred</div>
          ) : (
            <div className="flex items-center text-green-600">
              <i className="ri-check-line mr-1"></i>
              <span>Request successful</span>
            </div>
          )}
        </div>
        <Tabs value={view} onValueChange={(v) => onChangeView(v as "treeview" | "json")}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="treeview">Tree View</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-md">
        <ScrollArea className="h-[450px] pr-4">
          <div className="p-4">
            {view === "treeview" ? (
              <TreeView data={data} expandedByDefault={true} />
            ) : (
              <pre className="text-xs text-neutral-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface TreeViewProps {
  data: any;
  level?: number;
  expandedByDefault?: boolean;
}

function TreeView({ data, level = 0, expandedByDefault = true }: TreeViewProps) {
  // For top levels or array elements, expand by default, but collapse deeper nesting
  const [isExpanded, setIsExpanded] = React.useState(expandedByDefault && level < (level === 0 ? 4 : 2));
  
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Primitive value rendering
  if (data === null) {
    return <span className="text-gray-500">null</span>;
  }

  if (data === undefined) {
    return <span className="text-gray-500">undefined</span>;
  }

  if (typeof data === "string") {
    return <span className="text-green-600">"{data}"</span>;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return <span className="text-blue-600">{String(data)}</span>;
  }
  
  // Empty collections
  if (Array.isArray(data) && data.length === 0) {
    return <span className="text-gray-500">[]</span>;
  }
  
  if (typeof data === "object" && data !== null && Object.keys(data).length === 0) {
    return <span className="text-gray-500">{"{}"}</span>;
  }

  // Determine if item is expandable
  const isExpandable = (Array.isArray(data) && data.length > 0) || 
                       (typeof data === "object" && data !== null && Object.keys(data).length > 0);
  
  // Collection rendering (arrays and objects)
  if (isExpandable) {
    const isArray = Array.isArray(data);
    const bracketType = isArray ? ["[", "]"] : ["{", "}"];
    const keys = isArray ? Object.keys(data).map(Number) : Object.keys(data);
    
    // For compact presentation
    if (!isExpanded) {
      return (
        <span className="cursor-pointer inline-flex items-center" onClick={toggle}>
          <span className="transform inline-block w-4 text-gray-600">▶</span>
          <span className="text-gray-600">{bracketType[0]}</span>
          <span className="text-gray-400 ml-1">
            {isArray 
              ? `${data.length} items` 
              : `${Object.keys(data).length} properties`
            }
          </span>
          <span className="text-gray-600 ml-1">{bracketType[1]}</span>
        </span>
      );
    }
    
    // For expanded view
    return (
      <div className="font-mono" style={{ marginLeft: level > 0 ? 10 : 0 }}>
        <div className="cursor-pointer inline-flex items-center" onClick={toggle}>
          <span className="transform inline-block w-4 text-gray-600" style={{transform: 'rotate(90deg)'}}>▶</span>
          <span className="text-gray-600">{bracketType[0]}</span>
        </div>
        <div className="ml-3">
          {keys.map((key, index) => (
            <div key={isArray ? `${index}` : key.toString()} className="flex flex-wrap items-start mb-1">
              <span className={`${isArray ? "text-gray-500" : "text-red-600"} font-medium ${isArray ? 'w-8 inline-block' : ''}`}>
                {isArray ? `${key}:` : `"${key}":`}
              </span>
              <span className="inline-flex items-baseline flex-1">
                <TreeView 
                  data={data[key]} 
                  level={level + 1} 
                  expandedByDefault={expandedByDefault && level < 2}
                />
                {index < keys.length - 1 && <span className="text-gray-600 ml-1">,</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="text-gray-600">{bracketType[1]}</div>
      </div>
    );
  }

  return <span className="text-gray-500">{String(data)}</span>;
}