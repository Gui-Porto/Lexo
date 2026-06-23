"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "ATIVO" | "SUSPENSO" | "ARQUIVADO" | "ENCERRADO";

export type TimelineCase = {
  id: string;
  number: string;
  area: string | null;
  status: Status;
  createdAt: Date;
  client: { name: string };
};

const DOT: Record<Status, string> = {
  ATIVO:     "bg-emerald-500 ring-emerald-500/20",
  SUSPENSO:  "bg-amber-500   ring-amber-500/20",
  ARQUIVADO: "bg-blue-500    ring-blue-500/20",
  ENCERRADO: "bg-zinc-600    ring-zinc-600/20",
};

const STATUS_LABEL: Record<Status, string> = {
  ATIVO:     "Ativo",
  SUSPENSO:  "Suspenso",
  ARQUIVADO: "Arquivado",
  ENCERRADO: "Encerrado",
};

function groupByMonth(cases: TimelineCase[]) {
  const groups: { key: string; label: string; items: TimelineCase[] }[] = [];
  const seen = new Map<string, number>();

  cases.forEach((c) => {
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(c.createdAt));

    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ key: label, label, items: [] });
    }
    groups[seen.get(label)!].items.push(c);
  });

  return groups;
}

export function TimelineView({ cases }: { cases: TimelineCase[] }) {
  const sorted = [...cases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const groups = groupByMonth(sorted);

  if (sorted.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nenhum processo encontrado.
      </p>
    );
  }

  return (
    <div className="relative space-y-10 pl-8">
      {/* vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-brand/60 via-border/40 to-transparent" />

      {groups.map(({ key, label, items }) => (
        <div key={key} className="relative">
          {/* month marker */}
          <div className="absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 ring-2 ring-brand/40">
            <div className="h-2 w-2 rounded-full bg-brand" />
          </div>

          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 capitalize">
            {label}
          </h3>

          <div className="space-y-2">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/processos/${c.id}`}
                className="group flex items-start gap-3 rounded-xl border border-border/30 bg-card/40 p-3.5 backdrop-blur-sm transition-all hover:border-border/70 hover:bg-card hover:shadow-md"
              >
                <div
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4",
                    DOT[c.status]
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
                      {c.number}
                    </span>
                    {c.area && (
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                        {c.area}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50">
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.client.name}</p>
                </div>
                <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                  {formatDate(c.createdAt)}
                </time>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
