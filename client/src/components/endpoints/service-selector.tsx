import React from "react";
import { Card } from "@/components/ui/card";

interface ServiceSelectorProps {
  services: Record<string, boolean> | undefined;
  selectedService: string | null;
  onSelectService: (service: string) => void;
}

export function ServiceSelector({ services, selectedService, onSelectService }: ServiceSelectorProps) {
  // If services is undefined, show placeholder
  if (!services) {
    return (
      <div className="text-center py-6">
        <p className="text-neutral-500">No services available</p>
      </div>
    );
  }

  // Get the list of available services
  const availableServices = Object.entries(services)
    .filter(([_, isAvailable]) => isAvailable)
    .map(([name]) => name);

  if (availableServices.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-neutral-500">No services available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {availableServices.map((service) => (
        <Card
          key={service}
          className={`p-4 hover:border-blue-300 cursor-pointer transition-colors ${
            selectedService === service ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => onSelectService(service)}
        >
          <div className="flex items-center">
            <ServiceIcon service={service} />
            <div className="ml-3">
              <h3 className="font-medium">{getServiceName(service)}</h3>
              <p className="text-xs text-neutral-500">API Integration</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ServiceIcon({ service }: { service: string }) {
  let bgColor = "bg-neutral-200";
  let icon = "ri-question-line";

  switch (service) {
    case "slack":
      bgColor = "bg-[#4A154B]";
      icon = "ri-slack-line";
      break;
    case "notion":
      bgColor = "bg-black";
      icon = "ri-file-text-fill";
      break;
    case "github":
      bgColor = "bg-[#24292e]";
      icon = "ri-github-fill";
      break;
    case "linear":
      bgColor = "bg-[#5E6AD2]";
      icon = "ri-line-chart-line";
      break;
  }

  return (
    <div className={`w-10 h-10 rounded-md ${bgColor} flex items-center justify-center`}>
      <i className={`${icon} text-white text-lg`}></i>
    </div>
  );
}

function getServiceName(service: string): string {
  switch (service) {
    case "slack":
      return "Slack";
    case "notion":
      return "Notion";
    case "github":
      return "GitHub";
    case "linear":
      return "Linear";
    default:
      return service.charAt(0).toUpperCase() + service.slice(1);
  }
}