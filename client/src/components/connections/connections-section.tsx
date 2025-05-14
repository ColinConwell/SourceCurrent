import { useQuery } from "@tanstack/react-query";
import { ConnectionCard } from "./connection-card";
import { AddConnectionButton } from "./add-connection-button";
import { Connection } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function ConnectionsSection() {
  const { data: connections, isLoading, error } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Connected Services</h2>
        <AddConnectionButton />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-5" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          Error loading connections: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {connections && connections.length > 0 ? (
            connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                id={connection.id}
                service={connection.service}
                name={connection.name}
                description={getConnectionDescription(connection.service)}
                active={connection.active}
              />
            ))
          ) : (
            <div className="col-span-4 bg-white rounded-lg shadow-sm border border-neutral-200 p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <i className="ri-link-m text-primary-500 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No Connections Yet</h3>
              <p className="text-neutral-500 mb-4">Add your first connection to get started with DataConnect</p>
              <AddConnectionButton />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getConnectionDescription(service: string): string {
  switch (service) {
    case 'slack':
      return 'Access to channels, messages, and user data.';
    case 'linear':
      return 'Access to projects, issues, and team data.';
    case 'notion':
      return 'Access to pages, databases, and blocks.';
    case 'gdrive':
      return 'Access to files, folders and documents.';
    default:
      return 'Access to service data.';
  }
}
