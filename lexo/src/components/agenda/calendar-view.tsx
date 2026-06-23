import Link from "next/link";

export type CalendarDeadline = {
  id: string;
  title: string;
  date: Date;
  type: string;
  status: string;
};

type Props = {
  year: number;
  month: number; // 0-indexed
  deadlines: CalendarDeadline[];
  currentMonthParam: string; // "YYYY-MM" for URL
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

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export function CalendarView({ year, month, deadlines, currentMonthParam }: Props) {
  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  const nowMonthStr  = `${todayY}-${String(todayM + 1).padStart(2, "0")}`;

  // Group deadlines by "YYYY-MM-DD" (UTC date)
  const byDay = new Map<string, CalendarDeadline[]>();
  for (const d of deadlines) {
    const dt = new Date(d.date);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(d);
  }

  // Build cell array: null for padding, number for day
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const navBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid oklch(1 0 0 / 8%)",
    background: "oklch(0.155 0.02 264)",
    color: "oklch(0.70 0.02 264)",
    textDecoration: "none", fontSize: 18, lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={`?view=calendar&month=${prevMonthStr}`} style={navBtnStyle}>‹</Link>
        <Link href={`?view=calendar&month=${nextMonthStr}`} style={navBtnStyle}>›</Link>
        <span style={{ fontSize: 18, fontWeight: 700, color: "oklch(0.94 0.01 264)", letterSpacing: "-0.3px" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        {currentMonthParam !== nowMonthStr && (
          <Link
            href="?view=calendar"
            style={{
              fontSize: 12, fontWeight: 600, color: "oklch(0.66 0.18 274)",
              background: "oklch(0.66 0.18 274 / 12%)", border: "1px solid oklch(0.66 0.18 274 / 25%)",
              borderRadius: 7, padding: "3px 10px", textDecoration: "none",
            }}
          >
            Hoje
          </Link>
        )}
      </div>

      {/* Calendar grid */}
      <div style={{ border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 16, overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "oklch(0.11 0.015 264)", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: i === 0 ? "oklch(0.65 0.14 30)" : "oklch(0.42 0.02 264)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
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
                style={{
                  minHeight: 110, padding: "8px 6px", borderRight, borderBottom,
                  background: isToday ? "oklch(0.66 0.18 274 / 6%)" : "transparent",
                }}
              >
                {/* Day number */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <span
                    style={{
                      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "50%",
                      background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                      color: isToday ? "#fff" : (i % 7 === 0 ? "oklch(0.60 0.12 30)" : "oklch(0.55 0.02 264)"),
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {day}
                  </span>
                </div>

                {/* Event chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visible.map((ev) => {
                    const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                    const isDone = ev.status === "CONCLUIDO";
                    const isLost = ev.status === "PERDIDO";
                    return (
                      <Link
                        key={ev.id}
                        href={`/agenda/${ev.id}`}
                        title={ev.title}
                        style={{
                          display: "flex", alignItems: "center", gap: 3,
                          background: isDone || isLost ? "oklch(0.18 0.015 264)" : tc.bg,
                          color: isDone || isLost ? "oklch(0.42 0.02 264)" : tc.color,
                          borderRadius: 5, padding: "2px 5px",
                          fontSize: 11, fontWeight: 500,
                          textDecoration: "none",
                          overflow: "hidden", whiteSpace: "nowrap",
                          opacity: isDone || isLost ? 0.65 : 1,
                        }}
                      >
                        <span style={{ flexShrink: 0, fontSize: 10 }}>{TYPE_ICON[ev.type] ?? "📌"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                      </Link>
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
    </div>
  );
}
