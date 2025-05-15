import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  services: string[];
  selectedService: string | null;
  onSelectService: (service: string) => void;
}

export function ServiceSelector({ 
  services, 
  selectedService, 
  onSelectService 
}: ServiceSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a service</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service) => (
          <Card
            key={service}
            className={cn(
              "cursor-pointer transition-all hover:border-primary-500 p-4 flex flex-col items-center justify-center space-y-2",
              selectedService === service
                ? "border-2 border-primary-500 shadow-sm"
                : "border border-neutral-200"
            )}
            onClick={() => onSelectService(service)}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-100">
              {service === "slack" && <i className="ri-slack-line text-2xl text-primary-600"></i>}
              {service === "notion" && <i className="ri-file-list-line text-2xl text-primary-600"></i>}
              {service === "github" && <i className="ri-github-fill text-2xl text-primary-600"></i>}
              {service === "linear" && <i className="ri-line-chart-line text-2xl text-primary-600"></i>}
            </div>
            <span className="text-sm font-medium capitalize">{service}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}