"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutList, Columns3, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "table",    label: "Lista",    icon: LayoutList },
  { value: "kanban",   label: "Kanban",   icon: Columns3 },
  { value: "timeline", label: "Timeline", icon: Clock },
] as const;

type View = typeof VIEWS[number]["value"];

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: View) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-secondary/30 p-1">
      {VIEWS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setView(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            current === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
