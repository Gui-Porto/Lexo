"use client";

import Link from "next/link";
import { useState, useTransition, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { updateCaseStatus } from "@/actions/processos";
import { ChevronDown } from "lucide-react";

type Status = "ATIVO" | "SUSPENSO" | "ARQUIVADO" | "ENCERRADO";

export type KanbanCase = {
  id: string;
  number: string;
  area: string | null;
  status: Status;
  client: { name: string };
  responsavel: { name: string } | null;
};

const COLUMNS: { status: Status; label: string; accent: string; border: string }[] = [
  { status: "ATIVO",     label: "Ativos",     accent: "text-emerald-400", border: "border-emerald-500/25" },
  { status: "SUSPENSO",  label: "Suspensos",  accent: "text-amber-400",   border: "border-amber-500/25"  },
  { status: "ARQUIVADO", label: "Arquivados", accent: "text-blue-400",    border: "border-blue-500/25"   },
  { status: "ENCERRADO", label: "Encerrados", accent: "text-zinc-500",    border: "border-zinc-700/30"   },
];

const BADGE: Record<Status, string> = {
  ATIVO:     "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  SUSPENSO:  "text-amber-400   border-amber-500/30   bg-amber-500/10",
  ARQUIVADO: "text-blue-400    border-blue-500/30    bg-blue-500/10",
  ENCERRADO: "text-zinc-500    border-zinc-700/30    bg-zinc-800/40",
};

function StatusDropdown({
  caseId,
  current,
  onChange,
}: {
  caseId: string;
  current: Status;
  onChange: (id: string, s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const others = COLUMNS.filter((c) => c.status !== current);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80",
          BADGE[current]
        )}
      >
        {current}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1.5 min-w-[130px] overflow-hidden rounded-xl border border-border/40 bg-card shadow-2xl">
          {others.map(({ status, label }) => (
            <button
              key={status}
              onClick={(e) => { e.preventDefault(); onChange(caseId, status); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              Mover para <span className="font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanCard({
  c,
  onStatusChange,
}: {
  c: KanbanCase;
  onStatusChange: (id: string, s: Status) => void;
}) {
  return (
    <div className="group relative rounded-xl border border-border/30 bg-card/50 p-3.5 backdrop-blur-sm transition-all hover:border-border/70 hover:bg-card hover:shadow-md">
      <Link href={`/processos/${c.id}`} className="block">
        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
          {c.number}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.client.name}</p>
        {c.area && (
          <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
            {c.area}
          </p>
        )}
        {c.responsavel && (
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            {c.responsavel.name}
          </p>
        )}
      </Link>
      <div className="mt-2.5 flex items-center">
        <StatusDropdown caseId={c.id} current={c.status} onChange={onStatusChange} />
      </div>
    </div>
  );
}

export function KanbanBoard({ initialCases }: { initialCases: KanbanCase[] }) {
  const [cases, setCases] = useState(initialCases);
  const [, startTransition] = useTransition();

  function handleStatusChange(id: string, newStatus: Status) {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    startTransition(async () => {
      await updateCaseStatus(id, newStatus);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map(({ status, label, accent, border }) => {
        const col = cases.filter((c) => c.status === status);
        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-0.5">
              <h3 className={cn("text-sm font-semibold", accent)}>{label}</h3>
              <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {col.length}
              </span>
            </div>

            <div
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-2xl border-2 border-dashed p-2 transition-colors",
                border
              )}
            >
              {col.length === 0 ? (
                <p className="flex flex-1 items-center justify-center py-8 text-[11px] text-muted-foreground/40">
                  Sem processos
                </p>
              ) : (
                col.map((c) => (
                  <KanbanCard key={c.id} c={c} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
