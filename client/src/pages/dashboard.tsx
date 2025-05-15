import { useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ConnectionsSection } from "@/components/connections/connections-section";
import { DataPreview } from "@/components/dashboard/data-preview";
import { PipelineSection } from "@/components/dashboard/pipeline-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AutoConnectionsBanner } from "@/components/connections/auto-connections-banner";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Initial data fetching for connections, pipelines, and activities
  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
  });
  
  const { data: pipelines } = useQuery({
    queryKey: ['/api/pipelines'],
  });
  
  const { data: activities } = useQuery({
    queryKey: ['/api/activities', { limit: 10 }],
  });
  
  // Add a welcome message for first-time users
  useEffect(() => {
    // Check if this appears to be a new user (no connections)
    if (connections && Array.isArray(connections) && connections.length === 0) {
      toast({
        title: "Welcome to DataConnect!",
        description: "Get started by adding your first connection to integrate your workspace tools.",
      });
    }
  }, [connections, toast]);
  
  return (
    <AppLayout>
      <AutoConnectionsBanner />
      <div className="space-y-6 mb-8">
        <OverviewStats />
        <ConnectionsSection />
        <DataPreview />
        <PipelineSection />
        <RecentActivity />
      </div>
    </AppLayout>
  );
}
