import React, { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: number;
  userId: number;
  type: string;
  description: string;
  timestamp: string;
  details?: any;
  status?: string;
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("all");
  
  // Fetch activity data
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit: 50 }],
  });
  
  // Filter activities based on selected filter
  const filteredActivities = React.useMemo(() => {
    if (!activities) return [];
    
    if (filter === "all") return activities;
    
    return activities.filter(activity => activity.type === filter);
  }, [activities, filter]);
  
  // Icon mapping for different activity types
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "connection":
        return "ri-link-m";
      case "pipeline":
        return "ri-flow-chart";
      case "data_sync":
        return "ri-refresh-line";
      case "user":
        return "ri-user-line";
      case "system":
        return "ri-computer-line";
      default:
        return "ri-information-line";
    }
  };
  
  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Activity Log"
          description="View system events and user activities"
          icon="ri-history-line"
        >
          <div className="flex items-center space-x-2">
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="connection">Connections</SelectItem>
                <SelectItem value="pipeline">Pipelines</SelectItem>
                <SelectItem value="data_sync">Data Sync</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="system">System Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PageHeader>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-neutral-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-neutral-200 rounded w-[80px]"></div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-6 text-neutral-500">
                <i className="ri-file-search-line text-4xl mb-2"></i>
                <p>No activities found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 border-b last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4">
                      <i className={getActivityIcon(activity.type)}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{activity.description}</span>
                        <span className="text-sm text-neutral-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 capitalize">
                          {activity.type.replace('_', ' ')}
                        </span>
                        {activity.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center mt-4">
              <Button variant="outline">Load More</Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="user">
          <TabsList>
            <TabsTrigger value="user">User Activity</TabsTrigger>
            <TabsTrigger value="system">System Events</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-neutral-500">
                  <p>Detailed user activity log will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>System Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-neutral-500">
                  <p>System events and background tasks will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="errors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-neutral-500">
                  <p>Application errors and warnings will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}