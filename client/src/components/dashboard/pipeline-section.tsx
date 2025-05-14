import { useQuery } from "@tanstack/react-query";
import { PipelineCard } from "./pipeline-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pipeline } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function PipelineSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  
  const { 
    data: pipelines, 
    isLoading,
    error
  } = useQuery<Pipeline[]>({
    queryKey: ['/api/pipelines'],
  });
  
  const handleCreatePipeline = () => {
    setShowCreateModal(true);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">AI Pipeline Integration</h2>
        <Button onClick={handleCreatePipeline} className="flex items-center">
          <i className="ri-add-line mr-1.5"></i>
          Create Pipeline
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-5 w-36 mb-2" />
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          Error loading pipelines: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pipelines && pipelines.length > 0 ? (
            pipelines.map((pipeline) => (
              <PipelineCard
                key={pipeline.id}
                id={pipeline.id}
                name={pipeline.name}
                description={pipeline.description || ''}
                active={pipeline.active}
                createdAt={pipeline.createdAt}
                sources={getPipelineSources(pipeline)}
              />
            ))
          ) : (
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-neutral-200 p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <i className="ri-brain-line text-primary-500 text-2xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No Pipelines Yet</h3>
              <p className="text-neutral-500 mb-4">Create your first AI pipeline to transform and process your data</p>
              <Button onClick={handleCreatePipeline}>
                <i className="ri-add-line mr-1.5"></i>
                Create Pipeline
              </Button>
            </div>
          )}
        </div>
      )}
      
      <CreatePipelineModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

interface CreatePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreatePipelineModal({ isOpen, onClose }: CreatePipelineModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState({
    slack: false,
    notion: false,
    linear: false,
    gdrive: false
  });
  const [pipelineType, setPipelineType] = useState("text-analysis");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Pipeline name required",
        description: "Please enter a name for your pipeline.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      await apiRequest('POST', '/api/pipelines', {
        name,
        description,
        active: true,
        config: {
          type: pipelineType,
          services: selectedServices
        }
      });
      
      toast({
        title: "Pipeline created",
        description: `${name} pipeline has been created successfully.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to create pipeline",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New AI Pipeline</DialogTitle>
          <DialogDescription>
            Configure your pipeline to collect and transform data from your connected services.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="pipeline-name">Pipeline Name</Label>
            <Input 
              id="pipeline-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Product Insights Analysis"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="pipeline-description">Description (Optional)</Label>
            <Input 
              id="pipeline-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What this pipeline does..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="pipeline-type">Pipeline Type</Label>
            <Select value={pipelineType} onValueChange={setPipelineType}>
              <SelectTrigger id="pipeline-type" className="mt-1">
                <SelectValue placeholder="Select pipeline type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-analysis">Text Analysis</SelectItem>
                <SelectItem value="sentiment-analysis">Sentiment Analysis</SelectItem>
                <SelectItem value="data-extraction">Data Extraction</SelectItem>
                <SelectItem value="summarization">Content Summarization</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block mb-2">Connect Services</Label>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox 
                  id="slack-service" 
                  checked={selectedServices.slack} 
                  onCheckedChange={(checked) => 
                    setSelectedServices(prev => ({ ...prev, slack: !!checked }))
                  } 
                />
                <Label htmlFor="slack-service" className="ml-2 font-normal">
                  <span className="inline-flex items-center">
                    <span className="w-4 h-4 mr-1.5 rounded-sm" style={{ backgroundColor: '#4A154B' }}></span>
                    Slack
                  </span>
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="notion-service" 
                  checked={selectedServices.notion} 
                  onCheckedChange={(checked) => 
                    setSelectedServices(prev => ({ ...prev, notion: !!checked }))
                  } 
                />
                <Label htmlFor="notion-service" className="ml-2 font-normal">
                  <span className="inline-flex items-center">
                    <span className="w-4 h-4 mr-1.5 rounded-sm bg-black"></span>
                    Notion
                  </span>
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="linear-service" 
                  checked={selectedServices.linear} 
                  onCheckedChange={(checked) => 
                    setSelectedServices(prev => ({ ...prev, linear: !!checked }))
                  } 
                />
                <Label htmlFor="linear-service" className="ml-2 font-normal">
                  <span className="inline-flex items-center">
                    <span className="w-4 h-4 mr-1.5 rounded-sm" style={{ backgroundColor: '#5E6AD2' }}></span>
                    Linear
                  </span>
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="gdrive-service" 
                  checked={selectedServices.gdrive} 
                  onCheckedChange={(checked) => 
                    setSelectedServices(prev => ({ ...prev, gdrive: !!checked }))
                  } 
                />
                <Label htmlFor="gdrive-service" className="ml-2 font-normal">
                  <span className="inline-flex items-center">
                    <span className="w-4 h-4 mr-1.5 rounded-sm" style={{ backgroundColor: '#0F9D58' }}></span>
                    Google Drive
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-1"></i>
                Creating...
              </>
            ) : (
              'Create Pipeline'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to extract sources from pipeline config
function getPipelineSources(pipeline: Pipeline): { service: string; name: string; color: string }[] {
  const config = pipeline.config as { services?: Record<string, boolean> } | undefined;
  if (!config?.services) return [];
  
  const sources: { service: string; name: string; color: string }[] = [];
  
  if (config.services.slack) {
    sources.push({ service: 'slack', name: 'Slack', color: '#4A154B' });
  }
  
  if (config.services.notion) {
    sources.push({ service: 'notion', name: 'Notion', color: '#000000' });
  }
  
  if (config.services.linear) {
    sources.push({ service: 'linear', name: 'Linear', color: '#5E6AD2' });
  }
  
  if (config.services.gdrive) {
    sources.push({ service: 'gdrive', name: 'Google Drive', color: '#0F9D58' });
  }
  
  return sources;
}
