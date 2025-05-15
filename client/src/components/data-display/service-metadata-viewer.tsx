import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function ServiceMetadataViewer() {
  const { data: metadataResponse, isLoading } = useQuery({
    queryKey: ["/api/metadata/services"],
  });

  const metadata = metadataResponse?.data || {};
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Service Metadata...
          </CardTitle>
          <CardDescription>
            Collecting information about connected services...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const hasSlack = metadata.slack && metadata.slack.status !== "error";
  const hasNotion = metadata.notion && metadata.notion.status !== "error";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Metadata</CardTitle>
        <CardDescription>
          Information and statistics about your connected services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasSlack ? "slack" : (hasNotion ? "notion" : "none")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slack" disabled={!hasSlack}>Slack</TabsTrigger>
            <TabsTrigger value="notion" disabled={!hasNotion}>Notion</TabsTrigger>
          </TabsList>
          
          {hasSlack && (
            <TabsContent value="slack" className="space-y-4 pt-4">
              <SlackMetadata metadata={metadata.slack} />
            </TabsContent>
          )}
          
          {hasNotion && (
            <TabsContent value="notion" className="space-y-4 pt-4">
              <NotionMetadata metadata={metadata.notion} />
            </TabsContent>
          )}
          
          {!hasSlack && !hasNotion && (
            <div className="py-4 text-center text-muted-foreground">
              No service metadata available
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface SlackMetadataProps {
  metadata: any;
}

function SlackMetadata({ metadata }: SlackMetadataProps) {
  if (!metadata || !metadata.channel) {
    return <div>No Slack metadata available</div>;
  }
  
  const { channel, messages, users } = metadata;
  
  // Format timestamp into a human-readable date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  const messageTypes = messages.types || [];
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Channel Information</h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-sm font-medium">#{channel.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Members</span>
            <span className="text-sm font-medium">{channel.memberCount || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Created</span>
            <span className="text-sm font-medium">{formatDate(channel.created)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge variant={channel.isArchived ? "destructive" : "success"} className="w-fit mt-0.5">
              {channel.isArchived ? "Archived" : "Active"}
            </Badge>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-semibold text-sm">Message Statistics</h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total Messages</span>
            <span className="text-sm font-medium">{messages.count}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Unique Users</span>
            <span className="text-sm font-medium">{messages.uniqueUsers}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">First Message</span>
            <span className="text-sm font-medium">{formatDate(messages.oldestTimestamp)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Latest Message</span>
            <span className="text-sm font-medium">{formatDate(messages.newestTimestamp)}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-sm mb-2">Content Types</h3>
        <div className="flex flex-wrap gap-1">
          {messageTypes.map((type: string) => (
            <Badge key={type} variant="outline" className="capitalize">
              {type}
            </Badge>
          ))}
          {messageTypes.length === 0 && (
            <span className="text-xs text-muted-foreground">No content types detected</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotionMetadataProps {
  metadata: any;
}

function NotionMetadata({ metadata }: NotionMetadataProps) {
  if (!metadata || !metadata.page) {
    return <div>No Notion metadata available</div>;
  }
  
  const { page, databases, tasks } = metadata;
  
  // Format ISO date to readable format
  const formatDate = (isoDate: string) => {
    if (!isoDate) return "Unknown";
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };
  
  // Calculate task completion percentage
  const taskCompletionPercentage = tasks 
    ? Math.round((tasks.completed / (tasks.count || 1)) * 100) 
    : 0;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Page Information</h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Title</span>
            <span className="text-sm font-medium">
              {page.icon && <span className="mr-1">{page.icon}</span>}
              {page.title || "Untitled"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Created</span>
            <span className="text-sm font-medium">{formatDate(page.createdTime)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">{formatDate(page.lastEditedTime)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Databases</span>
            <span className="text-sm font-medium">{databases?.count || 0}</span>
          </div>
        </div>
      </div>
      
      {tasks && (
        <>
          <Separator />
          
          <div>
            <h3 className="font-semibold text-sm">Task Information</h3>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-xs">
                <span>Completion Progress</span>
                <span>{tasks.completed} of {tasks.count} completed</span>
              </div>
              <Progress value={taskCompletionPercentage} className="h-2" />
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">High Priority</span>
                  <span className="text-sm font-medium">{tasks.priorities?.high || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Medium Priority</span>
                  <span className="text-sm font-medium">{tasks.priorities?.medium || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Low Priority</span>
                  <span className="text-sm font-medium">{tasks.priorities?.low || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {databases?.list?.length > 0 && (
        <>
          <Separator />
          
          <div>
            <h3 className="font-semibold text-sm mb-2">Available Databases</h3>
            <div className="flex flex-wrap gap-1">
              {databases.list.map((db: any) => (
                <Badge 
                  key={db.id} 
                  variant={db.isTasks ? "default" : "outline"}
                >
                  {db.title}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}