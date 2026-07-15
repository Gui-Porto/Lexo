"use client";

import { useRef, useState } from "react";
import { formatTime } from "@/lib/format";
import { dayKey, isAllDayUTC } from "@/lib/agenda-date";
import { EventPopover, type PopoverSlot } from "@/components/agenda/event-popover";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06h..22h
const ROW_HEIGHT = 48; // px por hora

export type DayColumn = {
  key: string;   // "YYYY-MM-DD"
  label: string;
  isToday: boolean;
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "#cef79e38", color: "#cef79e" },
  AUDIENCIA:{ bg: "#8fae9438", color: "#8fae94" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "#93a09f47", color: "#93a09f" },
};
const TYPE_ICON: Record<string, string> = { PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌" };

export function TimeGrid({
  days,
  deadlines,
  cases,
}: {
  days: DayColumn[];
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const [popover, setPopover] = useState<PopoverSlot | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const byDay = new Map<string, CalendarDeadline[]>();
  for (const d of deadlines) {
    const k = dayKey(new Date(d.date));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(d);
  }

  function openCreate(e: React.MouseEvent<HTMLElement>, dateKey: string, hour: number) {
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "create", dateKey, hour });
  }

  function openEdit(e: React.MouseEvent<HTMLElement>, deadline: CalendarDeadline) {
    e.stopPropagation();
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "edit", deadline });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1px solid #4d5757", borderRadius: 16, overflow: "hidden" }}>
      {/* Cabeçalho dos dias */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, background: "#222f30", borderBottom: "1px solid #4d5757" }}>
        <div />
        {days.map((d) => (
          <div key={d.key} style={{ padding: "10px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, color: d.isToday ? "#cef79e" : "#93a09f" }}>
            {d.label}
          </div>
        ))}
      </div>

      {/* Faixa dia inteiro */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, borderBottom: "1px solid #4d5757", minHeight: 34 }}>
        <div style={{ fontSize: 10, color: "#93a09f", padding: "6px 6px", textAlign: "right" }}>dia</div>
        {days.map((d) => {
          const items = (byDay.get(d.key) ?? []).filter((ev) => isAllDayUTC(new Date(ev.date)));
          return (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 4px", borderLeft: "1px solid #4d5757" }}>
              {items.map((ev) => {
                const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => openEdit(e, ev)}
                    style={{
                      display: "flex", alignItems: "center", gap: 3, border: "none", cursor: "pointer",
                      background: tc.bg, color: tc.color, borderRadius: 5, padding: "2px 5px",
                      fontSize: 11, fontWeight: 500, textAlign: "left",
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}
                  >
                    <span>{TYPE_ICON[ev.type] ?? "📌"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Grade de horas */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, maxHeight: 560, overflowY: "auto" }}>
        <div>
          {HOURS.map((h) => (
            <div key={h} style={{ height: ROW_HEIGHT, borderTop: "1px solid #4d5757", fontSize: 10, color: "#93a09f", textAlign: "right", padding: "2px 6px" }}>
              {String(h).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {days.map((d) => {
          const timed = (byDay.get(d.key) ?? []).filter((ev) => !isAllDayUTC(new Date(ev.date)));
          return (
            <div key={d.key} style={{ position: "relative", borderLeft: "1px solid #4d5757" }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  onClick={(e) => openCreate(e, d.key, h)}
                  style={{ height: ROW_HEIGHT, borderTop: "1px solid #4d5757", cursor: "pointer" }}
                />
              ))}
              {timed.map((ev) => {
                const dt = new Date(ev.date);
                const hour = dt.getUTCHours();
                const minute = dt.getUTCMinutes();
                if (hour < HOURS[0] || hour > HOURS[HOURS.length - 1]) return null;
                const top = (hour - HOURS[0]) * ROW_HEIGHT + (minute / 60) * ROW_HEIGHT;
                const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => openEdit(e, ev)}
                    style={{
                      position: "absolute", left: 2, right: 2, top, height: 26,
                      display: "flex", alignItems: "center", gap: 4, border: "none", cursor: "pointer",
                      background: tc.bg, color: tc.color, borderRadius: 5, padding: "0 5px",
                      fontSize: 11, fontWeight: 500, textAlign: "left", zIndex: 1,
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{formatTime(ev.date)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                  </button>
                );
              })}
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
  );
}
