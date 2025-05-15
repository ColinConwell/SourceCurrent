import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface EndpointData {
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
  onSelectEndpoint: (endpoint: EndpointData) => void;
  selectedEndpoint: EndpointData | null;
  isExecuting: boolean;
}

export function EndpointList({
  endpoints,
  onSelectEndpoint,
  selectedEndpoint,
  isExecuting,
}: EndpointListProps) {
  // Group endpoints by category
  const groupedEndpoints = endpoints.reduce<Record<string, EndpointData[]>>(
    (acc, endpoint) => {
      if (!acc[endpoint.category]) {
        acc[endpoint.category] = [];
      }
      acc[endpoint.category].push(endpoint);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Available Endpoints</h3>
        {selectedEndpoint && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectEndpoint(null as unknown as EndpointData)}
          >
            Clear Selection
          </Button>
        )}
      </div>

      <Accordion type="multiple" className="space-y-2">
        {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
          <AccordionItem key={category} value={category} className="border rounded-md overflow-hidden">
            <AccordionTrigger className="px-4 py-2 hover:bg-neutral-50">
              <span className="text-sm font-semibold">{category}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="divide-y">
                {categoryEndpoints.map((endpoint) => (
                  <Card
                    key={endpoint.id}
                    className={cn(
                      "border-0 shadow-none cursor-pointer transition-all hover:bg-neutral-50",
                      selectedEndpoint?.id === endpoint.id && "bg-neutral-100"
                    )}
                    onClick={() => onSelectEndpoint(endpoint)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge
                          className={cn(
                            endpoint.method === "GET" && "bg-green-100 text-green-800 hover:bg-green-100",
                            endpoint.method === "POST" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                            endpoint.method === "PUT" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                            endpoint.method === "DELETE" && "bg-red-100 text-red-800 hover:bg-red-100"
                          )}
                        >
                          {endpoint.method}
                        </Badge>
                        <h4 className="text-sm font-medium">{endpoint.name}</h4>
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2">{endpoint.description}</p>
                      <div className="mt-1">
                        <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">{endpoint.endpoint}</code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {selectedEndpoint && (
        <div className="flex justify-end">
          <Button 
            disabled={isExecuting} 
            size="sm"
            onClick={() => onSelectEndpoint(selectedEndpoint)}
          >
            {isExecuting ? "Executing..." : "Execute Endpoint"}
          </Button>
        </div>
      )}
    </div>
  );
}