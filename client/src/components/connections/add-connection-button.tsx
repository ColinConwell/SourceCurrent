import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectionModal } from "./connection-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { serviceTypes } from "@shared/schema";

export function AddConnectionButton() {
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const handleAddConnection = () => {
    setShowServiceSelector(true);
  };
  
  const handleSelectService = (service: string) => {
    setSelectedService(service);
    setShowServiceSelector(false);
  };
  
  return (
    <>
      <Button onClick={handleAddConnection} className="flex items-center">
        <i className="ri-add-line mr-1.5"></i>
        Add New Connection
      </Button>
      
      {/* Service Selection Dialog */}
      <Dialog open={showServiceSelector} onOpenChange={setShowServiceSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Service to Connect</DialogTitle>
            <DialogDescription>
              Choose which service you want to integrate with DataConnect
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {serviceTypes.map((service) => (
              <button
                key={service.id}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                onClick={() => handleSelectService(service.id)}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-2" 
                  style={{ backgroundColor: service.color }}
                >
                  <i className={`${service.icon} text-white text-2xl`}></i>
                </div>
                <span className="font-medium">{service.name}</span>
              </button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceSelector(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connection Configuration Modal */}
      {selectedService && (
        <ConnectionModal
          service={selectedService}
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
