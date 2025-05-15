import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface EndpointData {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  category: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

interface EndpointListProps {
  endpoints: EndpointData[];
  selectedEndpoint: EndpointData | null;
  onSelectEndpoint: (endpoint: EndpointData) => void;
}

export function EndpointList({ endpoints, selectedEndpoint, onSelectEndpoint }: EndpointListProps) {
  // Group endpoints by category
  const categorizedEndpoints = endpoints.reduce((acc, endpoint) => {
    const category = endpoint.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(endpoint);
    return acc;
  }, {} as Record<string, EndpointData[]>);

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-neutral-500">No endpoints available for this service</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {Object.entries(categorizedEndpoints).map(([category, categoryEndpoints]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">{category}</h3>
            <div className="space-y-2">
              {categoryEndpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedEndpoint?.id === endpoint.id
                      ? "border-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => onSelectEndpoint(endpoint)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={getMethodColor(endpoint.method)}
                      >
                        {endpoint.method}
                      </Badge>
                      <span className="font-medium ml-2">{endpoint.name}</span>
                    </div>
                  </div>
                  {selectedEndpoint?.id === endpoint.id && (
                    <div className="mt-2">
                      <p className="text-sm text-neutral-600">
                        {endpoint.description}
                      </p>
                      <div className="mt-1 font-mono text-xs text-neutral-500">
                        {endpoint.endpoint}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function getMethodColor(method: string): string {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
    case "POST":
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
    case "PUT":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
    case "DELETE":
      return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
    default:
      return "";
  }
}