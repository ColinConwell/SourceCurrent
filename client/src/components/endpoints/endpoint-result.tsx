import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
        <ScrollArea className="h-[350px] pr-4">
          <div className="p-4">
            {view === "treeview" ? (
              <TreeView data={data} />
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
  depth?: number;
  path?: string;
}

function TreeView({ data, depth = 0, path = "" }: TreeViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (data === null) {
    return <span className="text-neutral-500">null</span>;
  }

  if (typeof data !== "object") {
    if (typeof data === "string") {
      return <span className="text-green-600">"{data}"</span>;
    }
    if (typeof data === "number") {
      return <span className="text-blue-600">{data}</span>;
    }
    if (typeof data === "boolean") {
      return <span className="text-purple-600">{data.toString()}</span>;
    }
    return <span>{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-neutral-500">[]</span>;
    }

    return (
      <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <div
          className="flex items-center cursor-pointer text-sm hover:bg-neutral-50 -mx-1 px-1 rounded"
          onClick={() => toggleExpand(path)}
        >
          <i
            className={`ri-arrow-${
              expanded[path] ? "down" : "right"
            }-s-line mr-1 text-neutral-600`}
          ></i>
          <span className="text-neutral-800">Array[{data.length}]</span>
        </div>
        {expanded[path] && (
          <div className="ml-4 border-l border-neutral-200 pl-2 mt-1">
            {data.map((item, index) => (
              <div key={`${path}.${index}`} className="mb-1">
                <div className="flex">
                  <span className="text-neutral-500 mr-2">{index}:</span>
                  <TreeView
                    data={item}
                    depth={depth + 1}
                    path={`${path}.${index}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Object
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return <span className="text-neutral-500">{"{}"}</span>;
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <div
        className="flex items-center cursor-pointer text-sm hover:bg-neutral-50 -mx-1 px-1 rounded"
        onClick={() => toggleExpand(path)}
      >
        <i
          className={`ri-arrow-${
            expanded[path] ? "down" : "right"
          }-s-line mr-1 text-neutral-600`}
        ></i>
        <span className="text-neutral-800">{"Object"}</span>
      </div>
      {expanded[path] && (
        <div className="ml-4 border-l border-neutral-200 pl-2 mt-1">
          {keys.map((key) => (
            <div key={`${path}.${key}`} className="mb-1">
              <div className="flex">
                <span className="text-neutral-800 font-medium mr-2">{key}:</span>
                <TreeView
                  data={data[key]}
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