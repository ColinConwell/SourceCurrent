import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface MetadataResponse {
  success: boolean;
  data: {
    slack?: any;
    notion?: any;
    [key: string]: any;
  };
}

export function ServiceMetadataViewer() {
  const { data: metadataResponse, isLoading } = useQuery<MetadataResponse>({
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
  
  const hasSlack = metadata && 'slack' in metadata && metadata.slack && metadata.slack.status !== "error";
  const hasNotion = metadata && 'notion' in metadata && metadata.notion && metadata.notion.status !== "error";
  const hasGitHub = metadata && 'github' in metadata && metadata.github && metadata.github.status !== "error";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Metadata</CardTitle>
        <CardDescription>
          Information and statistics about your connected services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasSlack ? "slack" : (hasNotion ? "notion" : (hasGitHub ? "github" : "none"))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="slack" disabled={!hasSlack}>Slack</TabsTrigger>
            <TabsTrigger value="notion" disabled={!hasNotion}>Notion</TabsTrigger>
            <TabsTrigger value="github" disabled={!hasGitHub}>GitHub</TabsTrigger>
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
          
          {hasGitHub && (
            <TabsContent value="github" className="space-y-4 pt-4">
              <GitHubMetadata metadata={metadata.github} />
            </TabsContent>
          )}
          
          {!hasSlack && !hasNotion && !hasGitHub && (
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
            <Badge variant={channel.isArchived ? "destructive" : "default"} className="w-fit mt-0.5">
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

interface GitHubMetadataProps {
  metadata: any;
}

function GitHubMetadata({ metadata }: GitHubMetadataProps) {
  if (!metadata || !metadata.user) {
    return <div>No GitHub metadata available</div>;
  }
  
  const { user, repositories } = metadata;
  
  // Format ISO date to readable format
  const formatDate = (isoDate: string) => {
    if (!isoDate) return "Unknown";
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };
  
  // Get top languages from repository stats
  const getTopLanguages = () => {
    if (!repositories.languageCounts) return [];
    
    return Object.entries(repositories.languageCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([language, count]) => ({ 
        language, 
        count: count as number,
        percentage: Math.round((count as number) / repositories.totalCount * 100)
      }));
  };
  
  const topLanguages = getTopLanguages();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        {user.avatarUrl && (
          <div className="mr-3 h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border">
            <img 
              src={user.avatarUrl} 
              alt={`${user.login}'s avatar`} 
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          <h3 className="font-semibold">{user.name || user.login}</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{user.login}</span>
            {user.location && (
              <>
                <span>•</span>
                <span>{user.location}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-muted/50 rounded-md p-3">
          <h4 className="text-xs font-medium text-muted-foreground">Repositories</h4>
          <p className="text-lg font-semibold">{repositories.totalCount}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3">
          <h4 className="text-xs font-medium text-muted-foreground">Stars</h4>
          <p className="text-lg font-semibold">{repositories.stargazerSum}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3">
          <h4 className="text-xs font-medium text-muted-foreground">Followers</h4>
          <p className="text-lg font-semibold">{user.followers}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3">
          <h4 className="text-xs font-medium text-muted-foreground">Following</h4>
          <p className="text-lg font-semibold">{user.following}</p>
        </div>
      </div>
      
      {topLanguages.length > 0 && (
        <>
          <Separator />
          
          <div>
            <h3 className="font-semibold text-sm mb-2">Top Languages</h3>
            <div className="space-y-2">
              {topLanguages.map(({ language, count, percentage }) => (
                <div key={language} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{language}</span>
                    <span className="text-muted-foreground">{percentage}% ({count} repos)</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {repositories.topStarred && repositories.topStarred.length > 0 && (
        <>
          <Separator />
          
          <div>
            <h3 className="font-semibold text-sm mb-2">Top Repositories</h3>
            <div className="space-y-2">
              {repositories.topStarred.map((repo: any) => (
                <div key={repo.name} className="border rounded-md p-2">
                  <div className="flex justify-between">
                    <div className="font-medium text-sm">{repo.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>⭐ {repo.stars}</span>
                      <span className="mx-1">•</span>
                      <span>🍴 {repo.forks}</span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                  )}
                  {repo.language && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {repo.language}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      <div className="text-xs text-muted-foreground mt-4">
        <span>Member since: {formatDate(user.createdAt)}</span>
      </div>
    </div>
  );
}