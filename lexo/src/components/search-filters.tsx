"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";

interface StatusOption {
  value: string;
  label: string;
}

interface SearchFiltersProps {
  statusOptions?: StatusOption[];
  statusParam?: string;
}

export function SearchFilters({ statusOptions, statusParam = "status" }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Buscar..."
        defaultValue={params.get("q") ?? ""}
        className="max-w-64"
        onChange={(e) => {
          const val = e.target.value;
          clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
          (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => push("q", val), 300);
        }}
      />
      {statusOptions && (
        <select
          defaultValue={params.get(statusParam) ?? ""}
          onChange={(e) => push(statusParam, e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
