import React, { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // List of FAQ items
  const faqItems = [
    {
      question: "How do I connect to Slack?",
      answer: "To connect to Slack, go to the Integrations page and click on the Slack card. You'll need to authorize the application with your Slack workspace and select which channels to access."
    },
    {
      question: "How do I create a data pipeline?",
      answer: "Create a data pipeline by going to the Dashboard, scrolling to the Pipelines section, and clicking 'Create Pipeline'. Then follow the wizard to select source data, transformation steps, and destination."
    },
    {
      question: "What permissions are required for GitHub integration?",
      answer: "The GitHub integration requires read access to your repositories. For private repositories, you'll need to grant additional permissions. The app uses GitHub's OAuth flow to securely access your data."
    },
    {
      question: "How often is data synced from connected services?",
      answer: "By default, data is synced every 15 minutes. You can adjust the sync frequency for each connection in the Configurations page under the Integrations tab."
    },
    {
      question: "Can I export data to other formats?",
      answer: "Yes, you can export data in JSON, CSV, and Excel formats. Look for the Export button in the data preview panels throughout the application."
    },
    {
      question: "How do I add more users to my account?",
      answer: "Navigate to the Configurations page, select the 'Users' tab, and click 'Invite User'. Enter their email address and select appropriate permissions."
    },
  ];
  
  // Filter FAQ items based on search query
  const filteredFaqItems = searchQuery
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Help & Documentation"
          description="Get help, read guides, and find answers to common questions"
          icon="ri-information-line"
        />
        
        <div className="relative">
          <Input
            className="py-6 pl-10 text-lg"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <i className="ri-search-line text-lg"></i>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i className="ri-book-open-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Getting Started</h3>
              <p className="text-neutral-600 mb-4">Learn the basics of using DataConnect and set up your first integration.</p>
              <Button variant="outline" className="w-full">View Guides</Button>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50">
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <i className="ri-video-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Video Tutorials</h3>
              <p className="text-neutral-600 mb-4">Watch step-by-step video guides on how to use all features.</p>
              <Button variant="outline" className="w-full">Watch Videos</Button>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50">
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <i className="ri-customer-service-2-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Get Support</h3>
              <p className="text-neutral-600 mb-4">Can't find what you need? Contact our support team.</p>
              <Button variant="outline" className="w-full">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="integrations">Integration Guides</TabsTrigger>
            <TabsTrigger value="api">API Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFaqItems.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500">
                    <i className="ri-search-eye-line text-4xl mb-2"></i>
                    <p>No results found for "{searchQuery}"</p>
                    <p className="text-sm">Try different keywords or check our guides section</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-neutral-600">{item.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integration Guides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4 hover:bg-neutral-50 cursor-pointer">
                    <div className="flex items-center">
                      <div className="p-2 bg-[#4A154B] rounded-md mr-3 text-white">
                        <i className="ri-slack-line text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-medium">Slack Integration Guide</h3>
                        <p className="text-sm text-neutral-500">
                          Learn how to connect and use Slack data
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-neutral-50 cursor-pointer">
                    <div className="flex items-center">
                      <div className="p-2 bg-black rounded-md mr-3 text-white">
                        <i className="ri-notion-fill text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-medium">Notion Integration Guide</h3>
                        <p className="text-sm text-neutral-500">
                          Learn how to connect and use Notion data
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-neutral-50 cursor-pointer">
                    <div className="flex items-center">
                      <div className="p-2 bg-[#24292e] rounded-md mr-3 text-white">
                        <i className="ri-github-fill text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-medium">GitHub Integration Guide</h3>
                        <p className="text-sm text-neutral-500">
                          Learn how to connect and use GitHub data
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-neutral-50 cursor-pointer">
                    <div className="flex items-center">
                      <div className="p-2 bg-[#5E6AD2] rounded-md mr-3 text-white">
                        <i className="ri-line-chart-line text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-medium">Linear Integration Guide</h3>
                        <p className="text-sm text-neutral-500">
                          Learn how to connect and use Linear data
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Introduction</h3>
                    <p className="text-neutral-600">
                      The DataConnect API allows you to programmatically access your data and control
                      integrations. Use our REST API to build custom applications or automations.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Authentication</h3>
                    <p className="text-neutral-600 mb-4">
                      All API requests require authentication using an API key. You can generate an API key
                      in the Configurations section.
                    </p>
                    <div className="bg-neutral-100 p-3 rounded-md text-sm font-mono overflow-x-auto">
                      <pre>curl -H "Authorization: Bearer YOUR_API_KEY" https://api.dataconnect.app/v1/connections</pre>
                    </div>
                  </div>
                  
                  <div className="text-center py-6">
                    <Button variant="default">View Full API Documentation</Button>
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