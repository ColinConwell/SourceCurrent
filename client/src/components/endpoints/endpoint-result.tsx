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
  isKey?: boolean;
}

function TreeView({ data, level = 0, expandedByDefault = true, isKey = false }: TreeViewProps) {
  const [isExpanded, setIsExpanded] = React.useState(expandedByDefault);
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // For primitive values
  if (data === null) {
    return <span className="text-gray-500">null</span>;
  }
  
  if (data === undefined) {
    return <span className="text-gray-500">undefined</span>;
  }
  
  if (typeof data === "string") {
    return <span className={isKey ? "text-red-600" : "text-green-600"}>"{data}"</span>;
  }
  
  if (typeof data === "number") {
    return <span className="text-blue-600">{data}</span>;
  }
  
  if (typeof data === "boolean") {
    return <span className="text-blue-600">{String(data)}</span>;
  }
  
  // For objects and arrays
  const isArray = Array.isArray(data);
  const isEmpty = isArray ? data.length === 0 : Object.keys(data).length === 0;
  
  // For empty collections
  if (isEmpty) {
    return <span className="text-gray-600">{isArray ? "[]" : "{}"}</span>;
  }
  
  const keys = isArray ? Array.from({ length: data.length }, (_, i) => i) : Object.keys(data);
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  
  const indentSize = 2;
  const indent = " ".repeat(indentSize * level);
  const childIndent = " ".repeat(indentSize * (level + 1));
  
  // If collapsed, show a compact summary
  if (!isExpanded) {
    return (
      <span className="font-mono whitespace-pre">
        <span className="cursor-pointer text-gray-500" onClick={toggleExpand}>▶ </span>
        <span className="text-gray-600">{openBracket}</span>
        <span className="text-gray-400 ml-1">
          {isArray 
            ? (keys.length === 1 ? "1 item" : `${keys.length} items`)
            : (keys.length === 1 ? "1 property" : `${keys.length} properties`)
          }
        </span>
        <span className="text-gray-600">{closeBracket}</span>
      </span>
    );
  }
  
  // Full expanded view, JSON style
  return (
    <div className="font-mono whitespace-pre">
      <span className="cursor-pointer" onClick={toggleExpand}>
        <span className="text-gray-500 transform rotate-90 inline-block">▶ </span>
        <span className="text-gray-600">{openBracket}</span>
      </span>
      <div>
        {keys.map((key, index) => {
          const actualKey = isArray ? Number(key) : key;
          // For arrays with Object/Array values, show a collapsed preview
          if (isArray && typeof data[actualKey] === 'object' && data[actualKey] !== null) {
            const objectData = data[actualKey];
            const itemCount = Array.isArray(objectData) ? objectData.length : Object.keys(objectData).length;
            const itemType = Array.isArray(objectData) ? "items" : "properties";
            
            return (
              <div key={`idx-${index}`} className="pl-4">
                <span className="text-gray-500">{key}</span>
                <span className="text-gray-600">: </span>
                <TreeView 
                  data={objectData} 
                  level={level + 1} 
                  expandedByDefault={false}
                />
                {index < keys.length - 1 && <span className="text-gray-600">,</span>}
              </div>
            );
          }
          
          // Normal object properties or primitive array items
          const itemValue = data[actualKey];
          return (
            <div key={isArray ? `idx-${index}` : key.toString()} className="pl-4">
              {isArray ? (
                // Array item (with index)
                <>
                  <span className="text-gray-500">{key}</span>
                  <span className="text-gray-600">: </span>
                  <TreeView 
                    data={itemValue} 
                    level={level + 1} 
                    expandedByDefault={level < 1}
                  />
                </>
              ) : (
                // Object property (with key)
                <>
                  <span className="text-red-600">"{key}"</span>
                  <span className="text-gray-600">: </span>
                  <TreeView 
                    data={itemValue} 
                    level={level + 1} 
                    expandedByDefault={level < 1}
                  />
                </>
              )}
              {index < keys.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          );
        })}
      </div>
      <span className="text-gray-600">{closeBracket}</span>
    </div>
  );
}