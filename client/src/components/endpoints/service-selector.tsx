import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ServiceType = "slack" | "notion" | "github" | "linear";

interface ServiceSelectorProps {
  selectedService: ServiceType | null;
  onChange: (service: ServiceType) => void;
  availableServices: Record<string, boolean>;
}

export function ServiceSelector({ selectedService, onChange, availableServices }: ServiceSelectorProps) {
  const services = [
    { id: "slack" as ServiceType, name: "Slack", icon: "ri-slack-line", color: "bg-[#4A154B]" },
    { id: "notion" as ServiceType, name: "Notion", icon: "ri-notion-fill", color: "bg-black" },
    { id: "github" as ServiceType, name: "GitHub", icon: "ri-github-fill", color: "bg-[#24292e]" },
    { id: "linear" as ServiceType, name: "Linear", icon: "ri-line-chart-line", color: "bg-[#5E6AD2]" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-md cursor-pointer transition-all",
                "hover:bg-neutral-100 border-2 border-transparent",
                selectedService === service.id && "border-primary/60 bg-primary/5",
                !availableServices[service.id] && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => {
                if (availableServices[service.id]) {
                  onChange(service.id);
                }
              }}
            >
              <div className={cn("p-3 rounded-full mb-2 text-white", service.color)}>
                <i className={cn(service.icon, "text-xl")}></i>
              </div>
              <span className="text-sm font-medium">{service.name}</span>
              
              {!availableServices[service.id] && (
                <div className="absolute top-1 right-1">
                  <i className="ri-lock-line text-neutral-400"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}