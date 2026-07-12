import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeleteButton } from "@/components/delete-button";
import { DeadlineToggle } from "@/components/agenda/deadline-toggle";
import { RiskBadge } from "@/components/agenda/risk-badge";
import { CalendarView } from "@/components/agenda/calendar-view";
import { WeekView } from "@/components/agenda/week-view";
import { DayView } from "@/components/agenda/day-view";
import { AgendaHeader, type AgendaView } from "@/components/agenda/agenda-header";
import {
  MONTH_NAMES, WEEKDAY_LONG, addDaysUTC, dayKey,
  formatDateParam, parseDateParam, startOfDayUTC, startOfWeekUTC,
} from "@/lib/agenda-date";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { deleteDeadline } from "@/actions/agenda";
import { formatDate } from "@/lib/format";
import Link from "next/link";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "PERDIDO", label: "Perdido" },
];

const TYPE_OPTIONS = [
  { value: "PRAZO", label: "Prazo" },
  { value: "AUDIENCIA", label: "Audiência" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "OUTRO", label: "Outro" },
];

const TYPE_ICON: Record<string, string> = {
  PRAZO: "⏰",
  AUDIENCIA: "⚖️",
  REUNIAO: "🤝",
  OUTRO: "📌",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 14%)", color: "oklch(0.66 0.18 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 14%)", color: "oklch(0.65 0.15 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)" },
  OUTRO:    { bg: "oklch(0.55 0.02 264 / 20%)", color: "oklch(0.65 0.02 264)" },
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string; month?: string; view?: string; date?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const { q, status, type, page: pageStr, month: monthStr, view: viewStr, date: dateStr } = sp;

  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse calendar month
  let calYear  = now.getUTCFullYear();
  let calMonth = now.getUTCMonth(); // 0-indexed
  let calMonthParam = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;

  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const [y, m] = monthStr.split("-").map(Number);
    calYear       = y;
    calMonth      = m - 1;
    calMonthParam = monthStr;
  }

  // Auto-expire overdue deadlines
  await db.deadline.updateMany({
    where: { organizationId: orgId, status: "PENDENTE", date: { lt: now } },
    data: { status: "PERDIDO" },
  });

  // KPI counts (always)
  const [statsHoje, statsProximos, statsVencidos, statsConcluidos] = await Promise.all([
    db.deadline.count({
      where: { organizationId: orgId, status: "PENDENTE", date: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86400000) } },
    }),
    db.deadline.count({
      where: { organizationId: orgId, status: "PENDENTE", date: { gte: startOfToday, lte: sevenDaysLater } },
    }),
    db.deadline.count({ where: { organizationId: orgId, status: "PERDIDO" } }),
    db.deadline.count({ where: { organizationId: orgId, status: "CONCLUIDO" } }),
  ]);

  // Calendário: prazos do mês
  const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
  const monthEnd   = new Date(Date.UTC(calYear, calMonth + 1, 0, 23, 59, 59, 999));

  // Visão ativa e período de dados
  const view: AgendaView = viewStr === "dia" || viewStr === "semana" ? viewStr : "mes";
  const todayUTC = startOfDayUTC(now);
  const nowMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const pivotDate = parseDateParam(dateStr, now);
  const weekStart = startOfWeekUTC(pivotDate);
  const dayStart  = startOfDayUTC(pivotDate);

  let rangeStart: Date;
  let rangeEnd: Date;
  let headerLabel: string;
  let prevHref: string;
  let nextHref: string;
  let todayHref: string;
  let isCurrentPeriod: boolean;

  if (view === "semana") {
    rangeStart = weekStart;
    rangeEnd = new Date(addDaysUTC(weekStart, 7).getTime() - 1);
    const weekEnd = addDaysUTC(weekStart, 6);
    headerLabel = weekStart.getUTCMonth() === weekEnd.getUTCMonth()
      ? `${weekStart.getUTCDate()}–${weekEnd.getUTCDate()} de ${MONTH_NAMES[weekStart.getUTCMonth()]} ${weekStart.getUTCFullYear()}`
      : `${weekStart.getUTCDate()} de ${MONTH_NAMES[weekStart.getUTCMonth()]} – ${weekEnd.getUTCDate()} de ${MONTH_NAMES[weekEnd.getUTCMonth()]} ${weekEnd.getUTCFullYear()}`;
    prevHref = `?view=semana&date=${formatDateParam(addDaysUTC(weekStart, -7))}`;
    nextHref = `?view=semana&date=${formatDateParam(addDaysUTC(weekStart, 7))}`;
    todayHref = `?view=semana`;
    isCurrentPeriod = dayKey(weekStart) === dayKey(startOfWeekUTC(now));
  } else if (view === "dia") {
    rangeStart = dayStart;
    rangeEnd = new Date(addDaysUTC(dayStart, 1).getTime() - 1);
    headerLabel = `${WEEKDAY_LONG[dayStart.getUTCDay()]}, ${dayStart.getUTCDate()} de ${MONTH_NAMES[dayStart.getUTCMonth()]}`;
    prevHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, -1))}`;
    nextHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, 1))}`;
    todayHref = `?view=dia`;
    isCurrentPeriod = dayKey(dayStart) === dayKey(todayUTC);
  } else {
    rangeStart = monthStart;
    rangeEnd = monthEnd;
    headerLabel = `${MONTH_NAMES[calMonth]} ${calYear}`;
    const prevMonthDate = new Date(calYear, calMonth - 1, 1);
    const nextMonthDate = new Date(calYear, calMonth + 1, 1);
    const prevMonthParam = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const nextMonthParam = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
    prevHref = `?view=mes&month=${prevMonthParam}`;
    nextHref = `?view=mes&month=${nextMonthParam}`;
    todayHref = `?view=mes`;
    isCurrentPeriod = calMonthParam === nowMonthStr;
  }

  const viewDeadlines = await db.deadline.findMany({
    where: { organizationId: orgId, date: { gte: rangeStart, lte: rangeEnd } },
    select: { id: true, title: true, date: true, type: true, status: true, description: true, caseId: true },
    orderBy: { date: "asc" },
  });

  const cases = await db.case.findMany({
    where: { organizationId: orgId },
    select: { id: true, number: true },
    orderBy: { number: "asc" },
  });

  // Lista: filtrada + paginada
  const listWhere = {
    organizationId: orgId,
    ...(status ? { status: status as "PENDENTE" | "CONCLUIDO" | "PERDIDO" } : {}),
    ...(type   ? { type: type as "PRAZO" | "AUDIENCIA" | "REUNIAO" | "OUTRO" } : {}),
    ...(q
      ? { OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { case: { number: { contains: q, mode: "insensitive" as const } } },
        ]}
      : {}),
  };

  const [deadlines, total] = await Promise.all([
    db.deadline.findMany({
      where: listWhere,
      include: { case: true },
      orderBy: { date: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.deadline.count({ where: listWhere }),
  ]);

  const kpis = [
    { label: "Hoje",          value: statsHoje,      sub: "vence hoje",  accent: statsHoje > 0 ? "warn" : "none"   },
    { label: "Próximos 7d",   value: statsProximos,  sub: "pendentes",   accent: statsProximos > 0 ? "info" : "none" },
    { label: "Vencidos",      value: statsVencidos,  sub: "em aberto",   accent: statsVencidos > 0 ? "danger" : "none" },
    { label: "Concluídos",    value: statsConcluidos, sub: "no total",   accent: "none" },
  ];

  const accentStyle = (accent: string) => {
    if (accent === "warn")   return { bg: "linear-gradient(160deg, oklch(0.75 0.16 50 / 14%), oklch(0.155 0.02 264))", border: "1px solid oklch(0.75 0.16 50 / 30%)", numColor: "oklch(0.97 0.01 264)", subColor: "oklch(0.75 0.16 50)" };
    if (accent === "danger") return { bg: "linear-gradient(160deg, oklch(0.70 0.18 30 / 14%), oklch(0.155 0.02 264))", border: "1px solid oklch(0.70 0.18 30 / 30%)", numColor: "oklch(0.97 0.01 264)", subColor: "oklch(0.70 0.18 30)" };
    if (accent === "info")   return { bg: "linear-gradient(160deg, oklch(0.66 0.18 274 / 14%), oklch(0.155 0.02 264))", border: "1px solid oklch(0.66 0.18 274 / 30%)", numColor: "oklch(0.97 0.01 264)", subColor: "oklch(0.75 0.16 50)" };
    return { bg: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", numColor: "oklch(0.97 0.008 264)", subColor: "oklch(0.45 0.02 264)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.5px", margin: 0 }}>
            Agenda
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 4 }}>
            Prazos, audiências e compromissos do escritório
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/agenda/novo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "oklch(0.66 0.18 274)", color: "#fff",
              border: "none", borderRadius: 10, padding: "9px 16px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              textDecoration: "none",
              boxShadow: "0 4px 14px oklch(0.66 0.18 274 / 35%)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo prazo
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => {
          const s = accentStyle(k.accent);
          return (
            <div key={k.label} style={{ background: s.bg, border: s.border, borderRadius: 14, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontSize: 30, fontWeight: 700, color: s.numColor, letterSpacing: "-1px", margin: 0 }}>{k.value}</p>
              <p style={{ fontSize: 12, color: s.subColor, marginTop: 4 }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Calendário (visão principal) ── */}
      <AgendaHeader
        view={view}
        label={headerLabel}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
        isCurrentPeriod={isCurrentPeriod}
        viewHref={(v) => `?view=${v}`}
      />

      {view === "mes" && (
        <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} />
      )}

      {view === "semana" && (
        <WeekView weekStart={formatDateParam(weekStart)} deadlines={viewDeadlines} cases={cases} />
      )}
      {view === "dia" && (
        <DayView day={formatDateParam(dayStart)} deadlines={viewDeadlines} cases={cases} />
      )}

      {/* ── Lista (visão secundária) ── */}
      <div style={{ borderTop: "1px solid oklch(1 0 0 / 7%)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.50 0.02 264)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Todos os prazos
        </h2>

        <>
          <Suspense>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <SearchFilters statusOptions={STATUS_OPTIONS} />
              <SearchFilters statusOptions={TYPE_OPTIONS} statusParam="type" />
            </div>
          </Suspense>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deadlines.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "60px 32px", gap: 12,
                background: "oklch(0.09 0.015 264)",
                border: "1px dashed oklch(0.25 0.018 264)", borderRadius: 16,
              }}>
                <span style={{ fontSize: 32 }}>📅</span>
                <p style={{ fontSize: 14, color: "oklch(0.50 0.02 264)", margin: 0 }}>Nenhum prazo encontrado.</p>
              </div>
            )}

            {deadlines.map((d) => {
              const tc = TYPE_COLORS[d.type] ?? TYPE_COLORS.OUTRO;
              const isLost = d.status === "PERDIDO";
              const isDone = d.status === "CONCLUIDO";

              return (
                <div
                  key={d.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: "oklch(0.155 0.02 264)",
                    border: `1px solid ${isLost ? "oklch(0.70 0.18 30 / 20%)" : isDone ? "oklch(0.72 0.15 150 / 15%)" : "oklch(1 0 0 / 7%)"}`,
                    borderRadius: 12, padding: "14px 18px",
                    opacity: isLost ? 0.65 : 1,
                  }}
                >
                  <DeadlineToggle deadlineId={d.id} completed={isDone} />

                  <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 8, padding: "4px 9px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13 }}>{TYPE_ICON[d.type] ?? "📌"}</span>
                    {d.type}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: isDone || isLost ? "oklch(0.55 0.02 264)" : "oklch(0.92 0.01 264)", textDecoration: isLost ? "line-through" : "none", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.title}
                    </p>
                    <p style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", marginTop: 3, fontFamily: "monospace" }}>
                      {d.case ? d.case.number : "Sem processo"} · {formatDate(d.date)}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {!isLost && !isDone && <RiskBadge date={d.date} type={d.type} status={d.status} />}
                    {isLost && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "oklch(0.70 0.18 30 / 14%)", color: "oklch(0.70 0.18 30)", borderRadius: 99, padding: "3px 10px" }}>Perdido</span>
                    )}
                    {isDone && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)", borderRadius: 99, padding: "3px 10px" }}>Concluído</span>
                    )}
                    <Link href={`/agenda/${d.id}`} style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", textDecoration: "none", padding: "5px 10px", borderRadius: 7, border: "1px solid oklch(1 0 0 / 8%)" }}>
                      Editar
                    </Link>
                    <DeleteButton action={deleteDeadline.bind(null, d.id)} label="Excluir" />
                  </div>
                </div>
              );
            })}
          </div>

          <Suspense>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
          </Suspense>
        </>
      </div>
    </div>
  );
}
