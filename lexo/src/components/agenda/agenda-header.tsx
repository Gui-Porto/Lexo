import Link from "next/link";
import { CalendarDays } from "lucide-react";

export type AgendaView = "dia" | "semana" | "mes";

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

const navBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid oklch(1 0 0 / 8%)",
  background: "oklch(0.155 0.02 264)",
  color: "oklch(0.70 0.02 264)",
  textDecoration: "none", fontSize: 18, lineHeight: 1,
};

export function AgendaHeader({
  view,
  label,
  prevHref,
  nextHref,
  todayHref,
  isCurrentPeriod,
  viewHref,
}: {
  view: AgendaView;
  label: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isCurrentPeriod: boolean;
  viewHref: (v: AgendaView) => string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={prevHref} style={navBtnStyle} aria-label="Anterior">‹</Link>
        <Link href={nextHref} style={navBtnStyle} aria-label="Próximo">›</Link>
        <span style={{ fontSize: 18, fontWeight: 700, color: "oklch(0.94 0.01 264)", letterSpacing: "-0.3px" }}>
          {label}
        </span>
        {isCurrentPeriod ? (
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.02 264)",
              background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 8%)",
              borderRadius: 8, padding: "6px 12px", opacity: 0.6,
            }}
          >
            <CalendarDays size={14} /> Hoje
          </span>
        ) : (
          <Link
            href={todayHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "oklch(0.66 0.18 274)",
              background: "oklch(0.66 0.18 274 / 12%)", border: "1px solid oklch(0.66 0.18 274 / 25%)",
              borderRadius: 8, padding: "6px 12px", textDecoration: "none",
            }}
          >
            <CalendarDays size={14} /> Hoje
          </Link>
        )}
      </div>

      <div style={{ display: "flex", background: "oklch(0.11 0.015 264)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 10, padding: 3, gap: 2 }}>
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={viewHref(v.value)}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
              textDecoration: "none",
              background: view === v.value ? "oklch(0.66 0.18 274)" : "transparent",
              color: view === v.value ? "#fff" : "oklch(0.60 0.02 264)",
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
