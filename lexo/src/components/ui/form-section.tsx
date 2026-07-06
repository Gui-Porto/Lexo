import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormSection({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function FormFooter({
  error,
  cancelHref,
  children,
}: {
  error?: string | null;
  cancelHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
      <p className="text-sm text-destructive">{error}</p>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" render={<Link href={cancelHref} />}>
          Cancelar
        </Button>
        {children}
      </div>
    </div>
  );
}

export function EmptyFormState({
  message,
  actionHref,
  actionLabel,
}: {
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" render={<Link href={actionHref} />}>
        {actionLabel}
      </Button>
    </div>
  );
}
