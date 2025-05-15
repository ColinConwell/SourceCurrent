import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center">
            <i className={cn(icon, "text-xl text-primary-600")}></i>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          {description && (
            <p className="mt-1 text-neutral-500 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
}