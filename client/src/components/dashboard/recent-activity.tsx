import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const { 
    data: activities, 
    isLoading,
    error
  } = useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit: 10 }],
  });
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
        <Button variant="link" className="text-primary-600 hover:text-primary-700 font-medium p-0">
          View All
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <ActivityLoadingSkeleton />
        ) : error ? (
          <div className="p-4 text-red-500">
            Error loading activities: {error.message}
          </div>
        ) : activities && activities.length > 0 ? (
          <ul className="divide-y divide-neutral-200">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                <i className="ri-history-line text-neutral-400 text-2xl"></i>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">No Activities Yet</h3>
            <p className="text-neutral-500">
              Your recent activities will appear here as you use the platform.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const { icon, iconBg, iconColor } = getActivityInfo(activity.type);
  
  return (
    <li className="p-4">
      <div className="flex items-start">
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} ${iconColor}`}></i>
        </div>
        <div className="ml-3">
          <p className="text-sm text-neutral-900">
            <span className="font-medium">{getActivityTitle(activity)}</span>
            <span className="text-neutral-500">{getActivityDescription(activity)}</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">{formatActivityTime(activity.createdAt)}</p>
        </div>
      </div>
    </li>
  );
}

function ActivityLoadingSkeleton() {
  return (
    <ul className="divide-y divide-neutral-200">
      {[...Array(4)].map((_, index) => (
        <li key={index} className="p-4">
          <div className="flex items-start">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="ml-3 w-full">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function getActivityInfo(type: string) {
  switch (type) {
    case 'data_sync':
      return {
        icon: 'ri-refresh-line',
        iconBg: 'bg-primary-100',
        iconColor: 'text-primary-600'
      };
    case 'connection_created':
    case 'connection_updated':
      return {
        icon: 'ri-checkbox-circle-line',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      };
    case 'pipeline_created':
    case 'pipeline_updated':
      return {
        icon: 'ri-rocket-line',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600'
      };
    case 'error':
      return {
        icon: 'ri-error-warning-line',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600'
      };
    default:
      return {
        icon: 'ri-information-line',
        iconBg: 'bg-neutral-100',
        iconColor: 'text-neutral-600'
      };
  }
}

function getActivityTitle(activity: Activity): string {
  switch (activity.type) {
    case 'data_sync':
      return 'Data Sync Completed';
    case 'connection_created':
      return 'Connection Created';
    case 'connection_updated':
      return 'Connection Updated';
    case 'pipeline_created':
      return 'Pipeline Created';
    case 'pipeline_updated':
      return 'Pipeline Updated';
    case 'pipeline_deleted':
      return 'Pipeline Deleted';
    case 'error':
      return 'Error Occurred';
    default:
      return 'Activity Logged';
  }
}

function getActivityDescription(activity: Activity): string {
  return ` - ${activity.description}`;
}

function formatActivityTime(dateString: string): string {
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
  } else if (diffMinutes < 2880) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
