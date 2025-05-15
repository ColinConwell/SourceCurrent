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
  level?: number;
}

function TreeView({ data, level = 0 }: TreeViewProps) {
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

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div style={{ marginLeft: level > 0 ? 20 : 0 }}>
        <div className="text-gray-600">[</div>
        {data.map((item, index) => (
          <div key={index} className="flex items-start">
            <div className="text-gray-500 mr-1">{index}:</div>
            <TreeView data={item} level={level + 1} />
            {index < data.length - 1 && <div className="text-gray-600">,</div>}
          </div>
        ))}
        <div className="text-gray-600">]</div>
      </div>
    );
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return <span className="text-gray-500">{"{}"}</span>;
    }

    return (
      <div style={{ marginLeft: level > 0 ? 20 : 0 }}>
        <div className="text-gray-600">{"{"}</div>
        {keys.map((key, index) => (
          <div key={key} className="flex items-start">
            <div className="text-red-600 mr-1">"{key}":</div>
            <TreeView data={data[key]} level={level + 1} />
            {index < keys.length - 1 && <div className="text-gray-600">,</div>}
          </div>
        ))}
        <div className="text-gray-600">{"}"}</div>
      </div>
    );
  }

  return <span className="text-gray-500">{String(data)}</span>;
}