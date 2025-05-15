import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div className="mb-4 md:mb-0">
        <div className="flex items-center mb-1">
          {icon && <i className={`${icon} text-xl mr-2 text-primary`}></i>}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}