import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoaderCircle, CheckCircle2, CircleAlertIcon } from "lucide-react";

type AutoConnectionsProps = {
  className?: string;
};

export function AutoConnectionsBanner({ className }: AutoConnectionsProps) {
  const [dismissed, setDismissed] = useState<boolean>(
    localStorage.getItem("autoConnectionsDismissed") === "true"
  );

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ['/api/connections'],
  });
  
  const { data: environmentData, isLoading: environmentLoading } = useQuery<any>({
    queryKey: ['/api/environment/services'],
  });

  // If there are no auto-connections or the banner was dismissed, don't show anything
  if (dismissed || !connections?.length) {
    return null;
  }

  // Count how many services were automatically configured
  const configuredServices = environmentData?.data?.configured || [];
  const autoConnectionCount = configuredServices.length;
  
  if (autoConnectionCount === 0) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem("autoConnectionsDismissed", "true");
    setDismissed(true);
  };

  // Format the list of automatically configured services
  const formattedServicesList = configuredServices
    .map((service: string) => service.charAt(0).toUpperCase() + service.slice(1))
    .join(", ");

  return (
    <Alert 
      className={cn(
        "bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-6",
        className
      )}
    >
      <div className="flex items-start">
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
        <div className="ml-3 flex-1">
          <AlertTitle className="text-green-800">
            API Connections Auto-Configured
          </AlertTitle>
          <AlertDescription className="text-green-700 mt-1">
            {environmentLoading ? (
              <div className="flex items-center">
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Detecting available API connections...
              </div>
            ) : (
              <>
                <p>
                  {autoConnectionCount} connection{autoConnectionCount !== 1 ? 's' : ''} ({formattedServicesList}) 
                  {autoConnectionCount === 1 ? ' was' : ' were'} automatically configured from your environment variables.
                </p>
                <p className="text-sm mt-1 text-green-600">
                  You can manage these connections in the connections section below.
                </p>
              </>
            )}
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 text-green-700 hover:text-green-800 hover:bg-green-100"
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </Alert>
  );
}