import { useState } from "react";
import { ConnectionModal } from "./connection-modal";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { serviceTypes } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ConnectionCardProps {
  id: number;
  service: string;
  name: string;
  description: string;
  active: boolean;
}

export function ConnectionCard({ id, service, name, description, active }: ConnectionCardProps) {
  const [isActive, setIsActive] = useState(active);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { toast } = useToast();

  const serviceInfo = serviceTypes.find(s => s.id === service) || {
    id: service,
    name: service.charAt(0).toUpperCase() + service.slice(1),
    icon: "ri-link",
    color: "#4B5563"
  };

  const handleToggleActive = async () => {
    try {
      const newState = !isActive;
      await apiRequest('PATCH', `/api/connections/${id}`, { active: newState });
      setIsActive(newState);
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });

      toast({
        title: newState ? "Connection Activated" : "Connection Deactivated",
        description: `${name} connection has been ${newState ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to update connection",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className={`connection-card bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: serviceInfo.color }}>
                <i className={`${serviceInfo.icon} text-white text-xl`}></i>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-neutral-900">{name}</h3>
                <p className="text-xs text-neutral-500">Connected</p>
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={handleToggleActive} id={`${service}-toggle-${id}`} />
          </div>

          <div className="text-sm text-neutral-500 mb-5">
            {description}
          </div>

          <div className="flex justify-between items-center">
            <Badge variant="green" className="inline-flex items-center">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500"></span>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <button
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => setIsConfigOpen(true)}
            >
              Configure
            </button>
          </div>
        </div>
      </div>

      {isConfigOpen && (
        <ConnectionModal
          connectionId={id}
          service={service}
          initialName={name}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
        />
      )}
    </>
  );
}
