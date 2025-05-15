import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface EndpointData {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

interface EndpointListProps {
  endpoints: EndpointData[];
  selectedEndpoint: EndpointData | null;
  onSelect: (endpoint: EndpointData) => void;
}

export function EndpointList({ endpoints, selectedEndpoint, onSelect }: EndpointListProps) {
  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-neutral-500">
        <p>No endpoints available for this service</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-3">
      <div className="space-y-2">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.id}
            className={`p-3 rounded-md border cursor-pointer hover:border-neutral-300 ${
              selectedEndpoint?.id === endpoint.id ? "border-primary/60 bg-primary/5" : "border-neutral-200"
            }`}
            onClick={() => onSelect(endpoint)}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">{endpoint.name}</span>
                <Badge
                  variant="outline"
                  className={`text-xs 
                    ${endpoint.method === "GET" ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                    ${endpoint.method === "POST" ? "bg-green-50 border-green-200 text-green-700" : ""}
                    ${endpoint.method === "PUT" ? "bg-amber-50 border-amber-200 text-amber-700" : ""}
                    ${endpoint.method === "DELETE" ? "bg-red-50 border-red-200 text-red-700" : ""}
                  `}
                >
                  {endpoint.method}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2 mb-1">{endpoint.description}</p>
            <div className="text-xs text-neutral-600 rounded bg-neutral-100 px-1 py-0.5 font-mono">
              {endpoint.endpoint}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}