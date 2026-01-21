
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: envData, isLoading } = useQuery({
        queryKey: ['/api/environment/services'],
    });

    const { data: safetyStatus, isLoading: isSafetyLoading } = useQuery({
        queryKey: ['/api/environment/safety'],
        // This endpoint needs to be created
    });

    const toggleSafetyMutation = useMutation({
        mutationFn: async (enabled: boolean) => {
            const res = await fetch('/api/environment/safety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/environment/safety'] });
        },
    });

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg bg-background border-2 border-primary/20 hover:border-primary"
                onClick={() => setIsOpen(true)}
            >
                <i className="ri-bug-line text-xl"></i>
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] shadow-2xl">
            <Card className="border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/50">
                    <CardTitle className="text-sm font-mono flex items-center">
                        <i className="ri-terminal-box-line mr-2"></i>
                        Debug Panel
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                        <i className="ri-close-line"></i>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px] p-4">
                        <div className="space-y-6">

                            {/* Safety Mode Section */}
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Safety Mode</h4>
                                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center">
                                            <span className="font-medium text-sm mr-2">Block Destructive Actions</span>
                                            {safetyStatus?.enabled && <Badge variant="default" className="bg-green-500 hover:bg-green-600 h-5 text-[10px]">ACTIVE</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Prevents DELETE/destructive operations</p>
                                    </div>
                                    <Switch
                                        checked={safetyStatus?.enabled ?? true}
                                        onCheckedChange={(checked) => toggleSafetyMutation.mutate(checked)}
                                        disabled={isSafetyLoading}
                                    />
                                </div>
                            </div>

                            {/* Environment Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Services Status</h4>
                                <div className="space-y-2">
                                    {isLoading ? (
                                        <div className="text-xs text-muted-foreground">Loading services...</div>
                                    ) : envData?.data?.availableServices ? (
                                        Object.entries(envData.data.availableServices).map(([service, connected]) => (
                                            <div key={service} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted font-mono">
                                                <span className="capitalize">{service}</span>
                                                <Badge variant={connected ? "outline" : "secondary"} className={connected ? "border-green-500 text-green-600" : "text-muted-foreground opacity-70"}>
                                                    {connected ? "ONLINE" : "OFFLINE"}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-muted-foreground">No service status available</div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Quick commands</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.location.reload()}>
                                        <i className="ri-refresh-line mr-1"></i> Reload App
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => queryClient.invalidateQueries()}>
                                        <i className="ri-database-2-line mr-1"></i> Refetch All
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
