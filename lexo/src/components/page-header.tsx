import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="bg-brand/10 border-brand/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
            <Icon className="text-brand h-4.5 w-4.5" />
          </div>
        )}
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
