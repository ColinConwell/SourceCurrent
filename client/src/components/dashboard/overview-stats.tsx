import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  connectedServices: number;
  dataSources: number;
  dataFrames: number;
  lastSync: string;
}

export function OverviewStats() {
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/connections'],
  });
  
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities', { limit: 1 }],
  });
  
  const isLoading = connectionsLoading || activitiesLoading;
  
  // Calculate stats based on actual data
  const stats: Stats = {
    connectedServices: connections?.filter(c => c.active).length || 0,
    dataSources: connections?.length || 0, // Simplified for demo
    dataFrames: Math.max(connections?.length - 1, 0) || 0, // Simplified for demo
    lastSync: activities && activities.length > 0 
      ? formatLastSync(activities[0].createdAt) 
      : 'Never'
  };
  
  const statItems = [
    {
      icon: "ri-link",
      iconBg: "bg-blue-50",
      iconColor: "text-primary-500",
      label: "Connected Services",
      value: stats.connectedServices
    },
    {
      icon: "ri-file-list-3-line",
      iconBg: "bg-green-50",
      iconColor: "text-secondary-500",
      label: "Data Sources",
      value: stats.dataSources
    },
    {
      icon: "ri-database-2-line",
      iconBg: "bg-purple-50",
      iconColor: "text-accent-500",
      label: "Data Frames",
      value: stats.dataFrames
    },
    {
      icon: "ri-time-line",
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-500",
      label: "Last Sync",
      value: stats.lastSync
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-5 border border-neutral-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${item.iconBg}`}>
              <i className={`${item.icon} ${item.iconColor} text-xl`}></i>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-neutral-500">{item.label}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <h3 className="text-xl font-semibold text-neutral-900">{item.value}</h3>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatLastSync(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `Today at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}
