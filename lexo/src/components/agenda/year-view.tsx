import Link from "next/link";
import { ViewTransition } from "react";
import { MONTH_NAMES, DAY_NAMES_SHORT, groupDeadlinesByDay } from "@/lib/agenda-date";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";

const TYPE_DOT_COLOR: Record<string, string> = {
  PRAZO: "oklch(0.66 0.18 274)",
  AUDIENCIA: "oklch(0.65 0.15 200)",
  REUNIAO: "oklch(0.72 0.15 150)",
  OUTRO: "oklch(0.55 0.02 264)",
};

export function YearView({
  year,
  deadlines,
}: {
  year: number;
  deadlines: CalendarDeadline[];
}) {
  const byDay = groupDeadlinesByDay(deadlines);
  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  return (
    <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {MONTH_NAMES.map((name, m) => {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const startDow = new Date(year, m, 1).getDay();
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        const monthParam = `${year}-${String(m + 1).padStart(2, "0")}`;

        return (
          <ViewTransition key={monthParam} name={`month-${monthParam}`} share="morph">
            <Link
              href={`?view=mes&month=${monthParam}`}
              style={{
                display: "block", textDecoration: "none",
                border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 12,
                padding: 10, background: "oklch(0.11 0.015 264)",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "oklch(0.85 0.02 264)", margin: "0 0 8px", textAlign: "center" }}>
                {name}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {DAY_NAMES_SHORT.map((d) => (
                  <span key={d} style={{ fontSize: 8, color: "oklch(0.40 0.02 264)", textAlign: "center" }}>{d[0]}</span>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <span key={`pad-${i}`} />;
                  const isToday = year === todayY && m === todayM && day === todayD;
                  const dateKey = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const items = byDay.get(dateKey) ?? [];
                  const types = Array.from(new Set(items.map((it) => it.type))).slice(0, 3);
                  return (
                    <div key={dateKey} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "2px 0" }}>
                      <span
                        style={{
                          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "50%", fontSize: 9,
                          background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                          color: isToday ? "#fff" : "oklch(0.60 0.02 264)",
                        }}
                      >
                        {day}
                      </span>
                      <div style={{ display: "flex", gap: 1, height: 3 }}>
                        {types.map((t) => (
                          <span key={t} style={{ width: 3, height: 3, borderRadius: "50%", background: TYPE_DOT_COLOR[t] ?? TYPE_DOT_COLOR.OUTRO }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          </ViewTransition>
        );
      })}
    </div>
  );
}
