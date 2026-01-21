
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    icon = 'ri-inbox-line',
    actionLabel,
    onAction,
    className = '',
    children
}: EmptyStateProps) {
    return (
        <Card className={`border-dashed ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <i className={`${icon} text-3xl text-neutral-400`}></i>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
                <p className="text-neutral-500 max-w-sm mb-6">{description}</p>

                {children}

                {actionLabel && (
                    <Button onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
