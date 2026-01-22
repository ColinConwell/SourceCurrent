import React from "react";
import AppLayout from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function ConfigurationsPage() {
  // Get available services
  const { data: servicesData } = useQuery<{ data: { availableServices: Record<string, boolean> } }>({
    queryKey: ['/api/environment/services'],
  });

  const availableServices = servicesData?.data?.availableServices || {};

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Configurations"
          description="Manage application settings and service configurations"
          icon="ri-settings-3-line"
        />

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="app-name">Application Name</label>
                    <input
                      id="app-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      defaultValue="DataConnect"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="timezone">Default Timezone</label>
                    <select
                      id="timezone"
                      className="w-full p-2 border rounded-md"
                      defaultValue="UTC"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                    <span className="text-sm">Enable email notifications</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Slack Settings */}
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-[#4A154B] rounded-md mr-3 text-white">
                          <i className="ri-slack-line text-lg"></i>
                        </div>
                        <div>
                          <h3 className="font-medium">Slack</h3>
                          <p className="text-sm text-neutral-500">
                            {availableServices?.slack
                              ? "Connected and active"
                              : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {availableServices?.slack ? "Reconfigure" : "Configure"}
                      </Button>
                    </div>
                    {availableServices?.slack && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Default Channel</label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="general">#general</option>
                            <option value="random">#random</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sync Frequency</label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="300">Every 5 minutes</option>
                            <option value="900">Every 15 minutes</option>
                            <option value="3600">Hourly</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notion Settings */}
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-black rounded-md mr-3 text-white">
                          <i className="ri-notion-fill text-lg"></i>
                        </div>
                        <div>
                          <h3 className="font-medium">Notion</h3>
                          <p className="text-sm text-neutral-500">
                            {availableServices?.notion
                              ? "Connected and active"
                              : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {availableServices?.notion ? "Reconfigure" : "Configure"}
                      </Button>
                    </div>
                    {availableServices?.notion && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Default Database</label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="tasks">Tasks Database</option>
                            <option value="projects">Projects Database</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sync Frequency</label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="300">Every 5 minutes</option>
                            <option value="900">Every 15 minutes</option>
                            <option value="3600">Hourly</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GitHub Settings */}
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-[#24292e] rounded-md mr-3 text-white">
                          <i className="ri-github-fill text-lg"></i>
                        </div>
                        <div>
                          <h3 className="font-medium">GitHub</h3>
                          <p className="text-sm text-neutral-500">
                            {availableServices?.github
                              ? "Connected and active"
                              : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {availableServices?.github ? "Reconfigure" : "Configure"}
                      </Button>
                    </div>
                  </div>

                  {/* Linear Settings */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-[#5E6AD2] rounded-md mr-3 text-white">
                          <i className="ri-line-chart-line text-lg"></i>
                        </div>
                        <div>
                          <h3 className="font-medium">Linear</h3>
                          <p className="text-sm text-neutral-500">
                            {availableServices?.linear
                              ? "Connected and active"
                              : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {availableServices?.linear ? "Reconfigure" : "Configure"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border rounded-md p-3 flex flex-col items-center cursor-pointer bg-primary/5 border-primary">
                      <div className="w-full h-12 bg-white border rounded-md mb-2"></div>
                      <span className="text-sm">Light</span>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center cursor-pointer">
                      <div className="w-full h-12 bg-neutral-900 rounded-md mb-2"></div>
                      <span className="text-sm">Dark</span>
                    </div>
                    <div className="border rounded-md p-3 flex flex-col items-center cursor-pointer">
                      <div className="w-full h-12 bg-gradient-to-r from-white to-neutral-900 rounded-md mb-2"></div>
                      <span className="text-sm">System</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Accent Color</h3>
                  <div className="grid grid-cols-6 gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer"></div>
                      <span className="text-xs mt-1">Blue</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer ring-2 ring-offset-2 ring-purple-500"></div>
                      <span className="text-xs mt-1">Purple</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-500 cursor-pointer"></div>
                      <span className="text-xs mt-1">Pink</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-orange-500 cursor-pointer"></div>
                      <span className="text-xs mt-1">Orange</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 cursor-pointer"></div>
                      <span className="text-xs mt-1">Green</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-500 cursor-pointer"></div>
                      <span className="text-xs mt-1">Gray</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Data Storage</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">Database Storage</h4>
                      <p className="text-sm text-neutral-500">Manage data storage preferences</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Rate Limiting</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">API Rate Limits</h4>
                      <p className="text-sm text-neutral-500">Configure API usage limits</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Danger Zone</h3>
                  <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                    <h4 className="font-medium text-red-600">Reset Application</h4>
                    <p className="text-sm text-red-500 mb-3">This will reset all configurations and delete all data.</p>
                    <Button variant="destructive" size="sm">Reset Application</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}