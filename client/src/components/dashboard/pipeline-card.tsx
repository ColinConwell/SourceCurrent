import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PipelineCardProps {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  sources: { service: string; name: string; color: string }[];
}

export function PipelineCard({ id, name, description, active, createdAt, sources }: PipelineCardProps) {
  const [isActive, setIsActive] = useState(active);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formattedDate = formatCreatedDate(createdAt);

  const handleToggleActive = async () => {
    try {
      const newState = !isActive;
      await apiRequest('PATCH', `/api/pipelines/${id}`, { active: newState });
      setIsActive(newState);
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });

      toast({
        title: newState ? "Pipeline Activated" : "Pipeline Deactivated",
        description: `${name} pipeline has been ${newState ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to update pipeline",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePipeline = async () => {
    try {
      setIsLoading(true);
      await apiRequest('DELETE', `/api/pipelines/${id}`);

      toast({
        title: "Pipeline Deleted",
        description: `${name} pipeline has been deleted.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to delete pipeline",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get a gradient color based on the name
  const getGradient = () => {
    if (name.toLowerCase().includes('product')) {
      return 'bg-gradient-to-r from-purple-500 to-primary-500';
    } else if (name.toLowerCase().includes('customer') || name.toLowerCase().includes('feedback')) {
      return 'bg-gradient-to-r from-orange-500 to-primary-500';
    } else if (name.toLowerCase().includes('marketing')) {
      return 'bg-gradient-to-r from-green-500 to-blue-500';
    } else if (name.toLowerCase().includes('sales')) {
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    } else {
      return 'bg-gradient-to-r from-indigo-500 to-primary-500';
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded flex items-center justify-center ${getGradient()}`}>
                <i className={`${name.toLowerCase().includes('customer') ? 'ri-customer-service-2-line' : 'ri-brain-line'} text-white text-xl`}></i>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-neutral-900">{name}</h3>
                <p className="text-xs text-neutral-500">Created {formattedDate}</p>
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={handleToggleActive} id={`pipeline-toggle-${id}`} />
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-neutral-700">Connected Sources:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <Badge
                  key={index}
                  variant="service"
                  color={source.color}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  <i className={`${getServiceIcon(source.service)} mr-1`}></i>
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Badge variant="green" className="inline-flex items-center">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500"></span>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <div className="flex items-center space-x-3">
              <button
                className="text-neutral-600 hover:text-neutral-900"
                onClick={() => setIsSettingsOpen(true)}
              >
                <i className="ri-settings-4-line"></i>
              </button>
              <button className="text-neutral-600 hover:text-neutral-900">
                <i className="ri-edit-line"></i>
              </button>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pipeline Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-500 mb-4">
              Configure advanced settings for your AI pipeline integration.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Processing Schedule</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">Hourly</Button>
                  <Button variant="outline" size="sm" className="justify-start">Daily</Button>
                  <Button variant="outline" size="sm" className="justify-start">Weekly</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Data Retention</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">30 days</Button>
                  <Button variant="outline" size="sm" className="justify-start">90 days</Button>
                  <Button variant="outline" size="sm" className="justify-start">1 year</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Output Format</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">JSON</Button>
                  <Button variant="outline" size="sm" className="justify-start">CSV</Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({
                title: "Settings saved",
                description: "Your pipeline settings have been updated.",
              });
              setIsSettingsOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{name}" pipeline? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePipeline}
              className="bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-1"></i>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatCreatedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
}

function getServiceIcon(service: string): string {
  switch (service) {
    case 'slack':
      return 'ri-slack-line';
    case 'notion':
      return 'ri-file-text-line';
    case 'linear':
      return 'ri-terminal-box-line';
    case 'gdrive':
      return 'ri-google-drive-line';
    default:
      return 'ri-link';
  }
}
