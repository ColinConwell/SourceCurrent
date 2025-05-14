import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceTypes } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ConnectionModalProps {
  connectionId?: number;
  service: string;
  initialName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({ 
  connectionId, 
  service, 
  initialName = "", 
  isOpen, 
  onClose 
}: ConnectionModalProps) {
  const [name, setName] = useState(initialName);
  const [workspace, setWorkspace] = useState("Company Workspace");
  const [syncSchedule, setSyncSchedule] = useState("Every hour");
  const [dataAccess, setDataAccess] = useState({
    channels: true,
    messages: true,
    users: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const serviceInfo = serviceTypes.find(s => s.id === service) || {
    id: service,
    name: service.charAt(0).toUpperCase() + service.slice(1),
    icon: "ri-link",
    color: "#4B5563"
  };
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (connectionId) {
        // Update existing connection
        await apiRequest('PATCH', `/api/connections/${connectionId}`, {
          name,
          config: { workspace, syncSchedule, dataAccess }
        });
        
        toast({
          title: "Connection updated",
          description: `${name} connection has been updated.`,
        });
      } else {
        // Create new connection
        await apiRequest('POST', '/api/connections', {
          service,
          name,
          active: true,
          credentials: {
            // In a real app, these would be provided by the OAuth process
            token: "demo-token",
            client_id: "demo-client-id",
            client_secret: "demo-client-secret"
          },
          config: { workspace, syncSchedule, dataAccess }
        });
        
        toast({
          title: "Connection created",
          description: `${name} connection has been added.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to save connection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded flex items-center justify-center mr-3" style={{ backgroundColor: serviceInfo.color }}>
              <i className={`${serviceInfo.icon} text-white text-xl`}></i>
            </div>
            <div>
              <DialogTitle>{serviceInfo.name} Configuration</DialogTitle>
              <DialogDescription>
                Configure your {serviceInfo.name} integration settings and permissions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="connection-name">Connection Name</Label>
            <Input 
              id="connection-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={`My ${serviceInfo.name} Connection`}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="workspace">Workspace</Label>
            <Select value={workspace} onValueChange={setWorkspace}>
              <SelectTrigger id="workspace" className="mt-1">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Company Workspace">Company Workspace</SelectItem>
                <SelectItem value="Product Team">Product Team</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700">
              Data to Access
            </Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-start">
                <Checkbox 
                  id="channels" 
                  checked={dataAccess.channels} 
                  onCheckedChange={(checked) => 
                    setDataAccess(prev => ({ ...prev, channels: !!checked }))
                  } 
                  className="mt-1"
                />
                <div className="ml-3">
                  <Label htmlFor="channels" className="font-medium">Channels</Label>
                  <p className="text-sm text-neutral-500">Access data from public channels</p>
                </div>
              </div>
              <div className="flex items-start">
                <Checkbox 
                  id="messages" 
                  checked={dataAccess.messages} 
                  onCheckedChange={(checked) => 
                    setDataAccess(prev => ({ ...prev, messages: !!checked }))
                  } 
                  className="mt-1"
                />
                <div className="ml-3">
                  <Label htmlFor="messages" className="font-medium">Messages</Label>
                  <p className="text-sm text-neutral-500">Access message history from channels</p>
                </div>
              </div>
              <div className="flex items-start">
                <Checkbox 
                  id="users" 
                  checked={dataAccess.users} 
                  onCheckedChange={(checked) => 
                    setDataAccess(prev => ({ ...prev, users: !!checked }))
                  } 
                  className="mt-1"
                />
                <div className="ml-3">
                  <Label htmlFor="users" className="font-medium">Users</Label>
                  <p className="text-sm text-neutral-500">Access user profile information</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="sync-schedule">Sync Schedule</Label>
            <Select value={syncSchedule} onValueChange={setSyncSchedule}>
              <SelectTrigger id="sync-schedule" className="mt-1">
                <SelectValue placeholder="Select sync frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Every 15 minutes">Every 15 minutes</SelectItem>
                <SelectItem value="Every hour">Every hour</SelectItem>
                <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-1"></i>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
