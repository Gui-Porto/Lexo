import Link from "next/link";
import { ViewTransition } from "react";
import { CalendarDays } from "lucide-react";

export type AgendaView = "ano" | "dia" | "semana" | "mes";

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: "ano", label: "Ano" },
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

const navBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid #4d5757",
  background: "#222f30",
  color: "#93a09f",
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
        <Link href={prevHref} style={navBtnStyle} aria-label="Anterior" transitionTypes={["nav-back"]}>‹</Link>
        <Link href={nextHref} style={navBtnStyle} aria-label="Próximo" transitionTypes={["nav-forward"]}>›</Link>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px" }}>
          {label}
        </span>
        {isCurrentPeriod ? (
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "#93a09f",
              background: "#222f30", border: "1px solid #4d5757",
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
              fontSize: 12, fontWeight: 600, color: "#cef79e",
              background: "#cef79e1f", border: "1px solid #cef79e40",
              borderRadius: 8, padding: "6px 12px", textDecoration: "none",
            }}
          >
            <CalendarDays size={14} /> Hoje
          </Link>
        )}
      </div>

      <div style={{ display: "flex", background: "#222f30", border: "1px solid #4d5757", borderRadius: 10, padding: 3, gap: 2 }}>
        {VIEWS.map((v) => {
          const isActive = view === v.value;
          const linkStyle: React.CSSProperties = {
            padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "block",
            background: isActive ? "#cef79e" : "transparent",
            color: isActive ? "#222f30" : "#93a09f",
          };
          if (isActive) {
            return (
              <ViewTransition key={v.value} name="view-pill">
                <Link href={viewHref(v.value)} style={linkStyle}>{v.label}</Link>
              </ViewTransition>
            );
          }
          return (
            <Link key={v.value} href={viewHref(v.value)} style={linkStyle}>
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
