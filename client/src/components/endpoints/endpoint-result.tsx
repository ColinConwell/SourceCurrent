import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface EndpointResultProps {
  data: any;
  isLoading: boolean;
  view: "treeview" | "json";
}

export function EndpointResult({ data, isLoading, view }: EndpointResultProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (view === "json") {
    return (
      <ScrollArea className="h-[500px]">
        <div className="font-mono text-sm bg-neutral-100 p-4 rounded-md whitespace-pre overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </div>
      </ScrollArea>
    );
  }

  // Tree view
  return (
    <ScrollArea className="h-[500px]">
      <div className="bg-neutral-100 p-4 rounded-md">
        <TreeView data={data} />
      </div>
    </ScrollArea>
  );
}

interface TreeViewProps {
  data: any;
  depth?: number;
  path?: string;
}

function TreeView({ data, depth = 0, path = "" }: TreeViewProps) {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set());

  const togglePath = (currentPath: string) => {
    setExpandedPaths((prev) => {
      const newPaths = new Set(prev);
      if (newPaths.has(currentPath)) {
        newPaths.delete(currentPath);
      } else {
        newPaths.add(currentPath);
      }
      return newPaths;
    });
  };

  if (data === null) {
    return <span className="text-neutral-500">null</span>;
  }

  if (typeof data !== "object") {
    return <span className="text-blue-600">{JSON.stringify(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
        <div
          className="flex items-center cursor-pointer hover:bg-neutral-200 p-1 rounded"
          onClick={() => togglePath(path)}
        >
          <span className="mr-1">
            {expandedPaths.has(path) ? "▼" : "►"}
          </span>
          <span className="text-purple-600">Array[{data.length}]</span>
        </div>
        {expandedPaths.has(path) && (
          <div className="ml-4 border-l-2 border-neutral-300 pl-2">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <div className="flex">
                  <span className="text-neutral-500 mr-2">{index}:</span>
                  <TreeView
                    data={item}
                    depth={depth + 1}
                    path={`${path}[${index}]`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const entries = Object.entries(data);
  
  if (entries.length === 0) {
    return <span className="text-neutral-500">{"{}"}</span>;
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        className="flex items-center cursor-pointer hover:bg-neutral-200 p-1 rounded"
        onClick={() => togglePath(path)}
      >
        <span className="mr-1">
          {expandedPaths.has(path) ? "▼" : "►"}
        </span>
        <span className="text-green-600">Object</span>
      </div>
      {expandedPaths.has(path) && (
        <div className="ml-4 border-l-2 border-neutral-300 pl-2">
          {entries.map(([key, value]) => (
            <div key={key} className="my-1">
              <div className="flex">
                <span className="text-neutral-700 font-medium mr-2">{key}:</span>
                <TreeView
                  data={value}
                  depth={depth + 1}
                  path={`${path}.${key}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}