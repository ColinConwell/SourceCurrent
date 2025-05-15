import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function IntegrationDashboard() {
  const [activeTab, setActiveTab] = useState<'slack' | 'notion' | 'github'>('slack');
  const { toast } = useToast();
  
  // Fetch integrated data from our API
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<any>({
    queryKey: ['/api/integration/dashboard'],
  });
  
  // When the component mounts, check connection status
  useEffect(() => {
    if (dashboardData) {
      const status = dashboardData.data?.integrationStatus;
      
      if (status) {
        if (status.slack === 'error') {
          toast({
            title: "Slack Connection Issue",
            description: "There was a problem connecting to Slack. Check your API credentials.",
            variant: "destructive"
          });
        }
        
        if (status.notion === 'error') {
          toast({
            title: "Notion Connection Issue",
            description: "There was a problem connecting to Notion. Check your API credentials.",
            variant: "destructive"
          });
        }

        if (status.github === 'error') {
          toast({
            title: "GitHub Connection Issue",
            description: "There was a problem connecting to GitHub. Check your API credentials.",
            variant: "destructive"
          });
        }
      }
    }
  }, [dashboardData, toast]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-900">Integration Dashboard</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <i className={`${isLoading ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'} mr-2`}></i>
          Refresh Data
        </Button>
      </div>
      
      {error ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-4 rounded-full bg-red-100 flex items-center justify-center">
                <i className="ri-error-warning-line text-red-500"></i>
              </div>
              <div>
                <h3 className="font-medium text-red-700">Error Loading Integration Data</h3>
                <p className="text-sm text-red-600">{error.message || "Please check your API connections and try again."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'slack' | 'notion' | 'github')}>
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="slack">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#4A154B' }}></div>
                Slack
              </div>
            </TabsTrigger>
            <TabsTrigger value="notion">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-sm bg-black"></div>
                Notion
              </div>
            </TabsTrigger>
            <TabsTrigger value="github">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded-sm bg-black"></div>
                GitHub
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="slack" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-6 h-6 mr-2 rounded-sm" style={{ backgroundColor: '#4A154B' }}>
                    <i className="ri-slack-line text-white text-sm flex items-center justify-center h-full"></i>
                  </div>
                  Slack Channel Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SlackLoadingSkeleton />
                ) : dashboardData?.data?.slack ? (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <h3 className="font-medium text-sm mb-1">Channel Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-neutral-500">Name:</span>{" "}
                          <span className="font-medium">{dashboardData.data.slack.channel_info.name}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Topic:</span>{" "}
                          <span className="font-medium">{dashboardData.data.slack.channel_info.topic || "No topic set"}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Members:</span>{" "}
                          <span className="font-medium">{dashboardData.data.slack.channel_info.member_count}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Recent Messages</h3>
                      <div className="border rounded-md divide-y">
                        {dashboardData.data.slack.messages.slice(0, 5).map((message: any, index: number) => (
                          <div key={index} className="p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                                {message.user_info?.profile?.image_24 ? (
                                  <img 
                                    src={message.user_info.profile.image_24} 
                                    alt={message.user_info.name || "User"} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium">
                                    {message.user_info?.name?.substring(0, 2).toUpperCase() || "U"}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center">
                                  <span className="font-medium text-sm">{message.user_info?.real_name || message.user_info?.name || "Unknown User"}</span>
                                  {message.is_bot && (
                                    <Badge variant="outline" className="ml-2 text-xs">BOT</Badge>
                                  )}
                                </div>
                                <p className="text-sm mt-1">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <i className="ri-slack-line text-neutral-400 text-lg"></i>
                    </div>
                    <h3 className="font-medium mb-1">No Slack Data Available</h3>
                    <p className="text-sm text-neutral-500 mb-3">Unable to fetch data from Slack. Check your API connection.</p>
                    <Button size="sm" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notion" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-6 h-6 mr-2 rounded-sm bg-black">
                    <i className="ri-file-text-fill text-white text-sm flex items-center justify-center h-full"></i>
                  </div>
                  Notion Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <NotionLoadingSkeleton />
                ) : dashboardData?.data?.notion?.tasks ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="bg-blue-50 rounded-md p-3">
                        <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
                        <p className="text-2xl font-semibold">{dashboardData.data.notion.tasks.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-md p-3">
                        <h3 className="text-sm font-medium text-green-700">Completed</h3>
                        <p className="text-2xl font-semibold">
                          {dashboardData.data.notion.tasks.filter((task: any) => task.isCompleted).length}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Task List</h3>
                      <div className="border rounded-md divide-y">
                        {dashboardData.data.notion.tasks.map((task: any, index: number) => (
                          <div key={index} className="p-3">
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`}>
                                {task.isCompleted && (
                                  <i className="ri-check-line text-white text-sm flex items-center justify-center h-full"></i>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center">
                                  <h4 className={`font-medium ${task.isCompleted ? 'line-through text-neutral-500' : ''}`}>
                                    {task.title}
                                  </h4>
                                  {task.section && (
                                    <Badge variant="outline" className="ml-2">{task.section}</Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-neutral-600 mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <i className="ri-file-text-line text-neutral-400 text-lg"></i>
                    </div>
                    <h3 className="font-medium mb-1">No Notion Tasks Available</h3>
                    <p className="text-sm text-neutral-500 mb-3">Unable to fetch tasks from Notion. Check your API connection.</p>
                    <Button size="sm" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="github" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-6 h-6 mr-2 rounded-sm bg-black">
                    <i className="ri-github-fill text-white text-sm flex items-center justify-center h-full"></i>
                  </div>
                  GitHub Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <GitHubLoadingSkeleton />
                ) : dashboardData?.data?.github?.repositories ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="bg-blue-50 rounded-md p-3">
                        <h3 className="text-sm font-medium text-blue-700">Total Repositories</h3>
                        <p className="text-2xl font-semibold">{dashboardData.data.github.repositories.length}</p>
                      </div>
                      <div className="bg-purple-50 rounded-md p-3">
                        <h3 className="text-sm font-medium text-purple-700">App Installation</h3>
                        <p className="text-2xl font-semibold">
                          {dashboardData.data.github.app_info ? 'Active' : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Repository List</h3>
                      <div className="border rounded-md divide-y">
                        {dashboardData.data.github.repositories.slice(0, 5).map((repo: any, index: number) => (
                          <div key={index} className="p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                                {repo.owner && repo.owner.avatar_url ? (
                                  <img 
                                    src={repo.owner.avatar_url} 
                                    alt={repo.owner.login || "Owner"} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <i className="ri-github-line text-neutral-600"></i>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center">
                                  <span className="font-medium text-sm">{repo.name}</span>
                                  {repo.private && (
                                    <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
                                  )}
                                </div>
                                <p className="text-sm mt-1 text-neutral-600">{repo.description || "No description"}</p>
                                <div className="flex items-center mt-2 text-xs text-neutral-500">
                                  {repo.language && (
                                    <div className="mr-3 flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                                      {repo.language}
                                    </div>
                                  )}
                                  <div className="mr-3 flex items-center">
                                    <i className="ri-star-line mr-1"></i>
                                    {repo.stargazers_count || 0}
                                  </div>
                                  <div className="flex items-center">
                                    <i className="ri-git-branch-line mr-1"></i>
                                    {repo.forks_count || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <i className="ri-github-line text-neutral-400 text-lg"></i>
                    </div>
                    <h3 className="font-medium mb-1">No GitHub Data Available</h3>
                    <p className="text-sm text-neutral-500 mb-3">Unable to fetch data from GitHub. Check your API connection.</p>
                    <Button size="sm" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SlackLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-neutral-50 p-3 rounded-md">
        <Skeleton className="h-5 w-48 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <div className="space-y-3">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="flex p-2">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="ml-3 space-y-2 w-full">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

function NotionLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      
      <Skeleton className="h-5 w-32 mb-2" />
      <div className="space-y-3">
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="flex p-2">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="ml-3 space-y-2 w-full">
        <div className="flex items-center">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-16 ml-2" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

function GitHubLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      
      <Skeleton className="h-5 w-32 mb-2" />
      <div className="space-y-3">
        <RepoSkeleton />
        <RepoSkeleton />
        <RepoSkeleton />
        <RepoSkeleton />
      </div>
    </div>
  );
}

function RepoSkeleton() {
  return (
    <div className="flex p-2">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="ml-3 space-y-2 w-full">
        <div className="flex items-center">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-16 ml-2" />
        </div>
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center">
          <Skeleton className="h-3 w-12 mr-2" />
          <Skeleton className="h-3 w-12 mr-2" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'High':
      return 'bg-red-500';
    case 'Medium':
      return 'bg-yellow-500';
    case 'Low':
      return 'bg-green-500';
    default:
      return 'bg-neutral-300';
  }
}