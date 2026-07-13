"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { EventPopover, type PopoverSlot } from "@/components/agenda/event-popover";
import { groupDeadlinesByDay } from "@/lib/agenda-date";

export type CalendarDeadline = {
  id: string;
  title: string;
  date: Date;
  type: string;
  status: string;
  description: string | null;
  caseId: string | null;
};

type Props = {
  year: number;
  month: number; // 0-indexed
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 22%)", color: "oklch(0.80 0.14 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 22%)", color: "oklch(0.78 0.13 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "oklch(0.45 0.02 264 / 28%)", color: "oklch(0.65 0.02 264)" },
};

const TYPE_ICON: Record<string, string> = {
  PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌",
};

const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DEFAULT_CREATE_HOUR = 9; // ponytail: mês não tem grade de hora; hora default editável no popover

export function CalendarView({ year, month, deadlines, cases }: Props) {
  const [popover, setPopover] = useState<PopoverSlot | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const byDay = groupDeadlinesByDay(deadlines);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function openCreate(e: React.MouseEvent<HTMLElement>, dateKey: string) {
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "create", dateKey, hour: DEFAULT_CREATE_HOUR });
  }

  function openEdit(e: React.MouseEvent<HTMLElement>, deadline: CalendarDeadline) {
    e.stopPropagation();
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "edit", deadline });
  }

  return (
    <ViewTransition name={`month-${monthParam}`} share="morph">
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Calendar grid */}
      <div className="r-tablewrap" style={{ border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 16, overflow: "hidden" }}>
        {/* Day headers */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "oklch(0.11 0.015 264)", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: i === 0 ? "oklch(0.65 0.14 30)" : "oklch(0.42 0.02 264)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            const isLastRow = i >= cells.length - 7;
            const isLastCol = (i + 1) % 7 === 0;
            const borderRight  = !isLastCol ? "1px solid oklch(1 0 0 / 5%)" : "none";
            const borderBottom = !isLastRow ? "1px solid oklch(1 0 0 / 5%)" : "none";

            if (day === null) {
              return (
                <div key={`pad-${i}`} style={{ minHeight: 110, borderRight, borderBottom, background: "oklch(0.10 0.013 264 / 0.6)" }} />
              );
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = year === todayY && month === todayM && day === todayD;
            const items   = byDay.get(dateKey) ?? [];
            const MAX = 3;
            const visible  = items.slice(0, MAX);
            const overflow = items.length - MAX;

            return (
              <div
                key={dateKey}
                onClick={(e) => openCreate(e, dateKey)}
                style={{
                  minHeight: 110, padding: "8px 6px", borderRight, borderBottom, cursor: "pointer",
                  background: isToday ? "oklch(0.66 0.18 274 / 6%)" : "transparent",
                }}
              >
                {/* Day number — drill-in pra visão Dia */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <ViewTransition name={`day-${dateKey}`}>
                    <Link
                      href={`?view=dia&date=${dateKey}`}
                      onClick={(e) => e.stopPropagation()}
                      className={isToday ? "animate-today-pulse" : undefined}
                      style={{
                        width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%", textDecoration: "none",
                        background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                        color: isToday ? "#fff" : (i % 7 === 0 ? "oklch(0.60 0.12 30)" : "oklch(0.55 0.02 264)"),
                        fontSize: 12, fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {day}
                    </Link>
                  </ViewTransition>
                </div>

                {/* Event chips — clique abre popover de editar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visible.map((ev, idx) => {
                    const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                    const isDone = ev.status === "CONCLUIDO";
                    const isLost = ev.status === "PERDIDO";
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        title={ev.title}
                        onClick={(e) => openEdit(e, ev)}
                        className="animate-fade-up"
                        style={
                          {
                            "--delay": `${idx * 40}ms`,
                            display: "flex", alignItems: "center", gap: 3, border: "none", cursor: "pointer",
                            background: isDone || isLost ? "oklch(0.18 0.015 264)" : tc.bg,
                            color: isDone || isLost ? "oklch(0.42 0.02 264)" : tc.color,
                            borderRadius: 5, padding: "2px 5px",
                            fontSize: 11, fontWeight: 500, textAlign: "left",
                            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                            opacity: isDone || isLost ? 0.65 : 1,
                          } as React.CSSProperties
                        }
                      >
                        <span style={{ flexShrink: 0, fontSize: 10 }}>{TYPE_ICON[ev.type] ?? "📌"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <span style={{ fontSize: 10, color: "oklch(0.46 0.02 264)", paddingLeft: 4 }}>
                      +{overflow} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { type: "PRAZO", label: "Prazo" },
          { type: "AUDIENCIA", label: "Audiência" },
          { type: "REUNIAO", label: "Reunião" },
          { type: "OUTRO", label: "Outro" },
        ].map(({ type, label }) => {
          const tc = TYPE_COLORS[type];
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>{TYPE_ICON[type]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 5, padding: "2px 7px" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {popover && (
        <EventPopover
          slot={popover}
          cases={cases}
          anchorRef={anchorRef}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
    </ViewTransition>
  );
}
