
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Connection {
    id: number;
    name: string;
    service: string;
    active: boolean;
    created_at: string;
}

interface ServiceDef {
    id: string;
    name: string;
    icon: string;
    color: string;
    disabled?: boolean;
}

const AVAILABLE_SERVICES: ServiceDef[] = [
    { id: 'slack', name: 'Slack', icon: 'ri-slack-line', color: '#4A154B' },
    { id: 'notion', name: 'Notion', icon: 'ri-file-text-fill', color: '#000000' },
    { id: 'github', name: 'GitHub', icon: 'ri-github-fill', color: '#181717' },
    { id: 'linear', name: 'Linear', icon: 'ri-list-check', color: '#5E6AD2' },
    { id: 'gdrive', name: 'Google Drive', icon: 'ri-google-drive-fill', color: '#1FA463' },
    // Placeholders for Phase 3
    { id: 'gmail', name: 'Gmail', icon: 'ri-mail-line', color: '#EA4335' },
    { id: 'gcal', name: 'Google Calendar', icon: 'ri-calendar-line', color: '#4285F4' },
    { id: 'discord', name: 'Discord', icon: 'ri-discord-line', color: '#5865F2' },
];

export function ConnectionManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: connections, isLoading } = useQuery<Connection[]>({
        queryKey: ['/api/connections'],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/connections/${id}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
            toast({ title: "Connection removed" });
        },
        onError: () => {
            toast({ title: "Failed to remove connection", variant: "destructive" });
        }
    });

    const handleConnect = (serviceId: string) => {
        // In a real app, this would be a full OAuth redirect
        // For some services we might just mock it or need the backend route to exist
        window.location.href = `/api/auth/${serviceId}`;
    };

    const isConnected = (serviceId: string) => {
        return connections?.some(c => c.service === serviceId && c.active);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_SERVICES.map((service) => {
                const connected = isConnected(service.id);
                const connection = connections?.find(c => c.service === service.id);

                return (
                    <Card key={service.id} className={service.disabled ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {service.name}
                            </CardTitle>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: service.disabled ? '#ccc' : service.color }}
                            >
                                <i className={`${service.icon} text-lg`}></i>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-4 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Status</span>
                                    {connected ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>
                                    )}
                                </div>

                                {connected ? (
                                    <div className="space-y-2">
                                        <div className="text-xs font-mono bg-muted p-2 rounded truncate">
                                            {connection?.name || "Connected"}
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => connection && deleteMutation.mutate(connection.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                            Disconnect
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleConnect(service.id)}
                                        disabled={service.disabled}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
