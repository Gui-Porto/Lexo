import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="animate-fade-up flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-brand/10 border-brand/20 flex h-9 w-9 items-center justify-center rounded-lg border">
            <Icon className="text-brand h-4.5 w-4.5" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
