import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";

export function IntegrationDashboard() {
  const [activeTab, setActiveTab] = useState<'slack' | 'notion' | 'github' | 'gmail' | 'gcal' | 'discord'>('slack');
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

        if (status.gmail === 'error') {
          toast({
            title: "Gmail Connection Issue",
            description: "There was a problem connecting to Gmail. Check your API credentials.",
            variant: "destructive"
          });
        }

        if (status.gcal === 'error') {
          toast({
            title: "Calendar Connection Issue",
            description: "There was a problem connecting to Google Calendar. Check your API credentials.",
            variant: "destructive"
          });
        }

        if (status.discord === 'error') {
          toast({
            title: "Discord Connection Issue",
            description: "There was a problem connecting to Discord. Check your API credentials.",
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-3 w-full max-w-[600px] h-auto">
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
            <TabsTrigger value="gmail">
              <div className="flex items-center">
                <i className="ri-mail-line mr-2 text-red-500"></i>
                Gmail
              </div>
            </TabsTrigger>
            <TabsTrigger value="gcal">
              <div className="flex items-center">
                <i className="ri-calendar-line mr-2 text-blue-500"></i>
                Calendar
              </div>
            </TabsTrigger>
            <TabsTrigger value="discord">
              <div className="flex items-center">
                <i className="ri-discord-line mr-2 text-indigo-500"></i>
                Discord
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
                  <EmptyState
                    title="No Slack Data Available"
                    description="Unable to fetch data from Slack. Check your API connection."
                    icon="ri-slack-line"
                    actionLabel="Try Again"
                    onAction={() => refetch()}
                  />
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
                  <EmptyState
                    title="No Notion Tasks Available"
                    description="Unable to fetch tasks from Notion. Check your API connection."
                    icon="ri-file-text-line"
                    actionLabel="Try Again"
                    onAction={() => refetch()}
                  />
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
                  <EmptyState
                    title="No GitHub Data Available"
                    description="Unable to fetch data from GitHub. Check your API connection."
                    icon="ri-github-line"
                    actionLabel="Try Again"
                    onAction={() => refetch()}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* GMAIL TAB */}
          <TabsContent value="gmail" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-mail-fill text-red-500 mr-2"></i>
                  Gmail Inbox
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : dashboardData?.data?.gmail?.profile ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 p-3 rounded-md flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{dashboardData.data.gmail.profile.emailAddress}</h3>
                        <p className="text-sm text-neutral-600">Total Messages: {dashboardData.data.gmail.profile.messagesTotal}</p>
                      </div>
                    </div>
                    <div className="border rounded-md divide-y">
                      {dashboardData.data.gmail.inbox?.messages?.map((msg: any, i: number) => (
                        <div key={i} className="p-3">
                          <h4 className="font-medium text-sm">{msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject'}</h4>
                          <p className="text-xs text-neutral-500 truncate">{msg.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No Gmail Data" description="Connect Gmail to see your emails." icon="ri-mail-line" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALENDAR TAB */}
          <TabsContent value="gcal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-calendar-fill text-blue-500 mr-2"></i>
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : dashboardData?.data?.gcal?.events ? (
                  <div className="space-y-2">
                    {dashboardData.data.gcal.events.items?.map((evt: any, i: number) => (
                      <div key={i} className="border p-3 rounded-md flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{evt.summary}</h4>
                          <p className="text-xs text-neutral-500">
                            {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : 'All Day'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!dashboardData.data.gcal.events.items || dashboardData.data.gcal.events.items.length === 0) && (
                      <p className="text-center text-neutral-500 py-4">No upcoming events found.</p>
                    )}
                  </div>
                ) : (
                  <EmptyState title="No Calendar Data" description="Connect Google Calendar to see events." icon="ri-calendar-line" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISCORD TAB */}
          <TabsContent value="discord" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-discord-fill text-indigo-500 mr-2"></i>
                  Discord Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : dashboardData?.data?.discord?.userInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center bg-indigo-50 p-4 rounded-md">
                      <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
                        {dashboardData.data.discord.userInfo.username[0]}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-lg">{dashboardData.data.discord.userInfo.username}</h3>
                        <p className="text-sm text-neutral-600">ID: {dashboardData.data.discord.userInfo.id}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Guilds (Servers)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {dashboardData.data.discord.guilds?.map((guild: any, i: number) => (
                          <div key={i} className="border p-2 rounded flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            <span className="text-sm truncate">{guild.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No Discord Data" description="Connect Discord to see your profile." icon="ri-discord-line" />
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