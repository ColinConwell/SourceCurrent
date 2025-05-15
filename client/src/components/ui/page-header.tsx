interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b space-y-2 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-500 mt-1">{description}</p>
        )}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}