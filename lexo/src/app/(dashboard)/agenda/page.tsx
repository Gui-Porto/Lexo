import { Suspense, ViewTransition } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeleteButton } from "@/components/delete-button";
import { DeadlineToggle } from "@/components/agenda/deadline-toggle";
import { RiskBadge } from "@/components/agenda/risk-badge";
import { CalendarView } from "@/components/agenda/calendar-view";
import { YearView } from "@/components/agenda/year-view";
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
import { pullGoogleChanges } from "@/lib/google-calendar-pull";
import { formatDate, formatRelativeDay } from "@/lib/format";
import Link from "next/link";

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
  PRAZO:    { bg: "#cef79e24", color: "#cef79e" },
  AUDIENCIA:{ bg: "#8fae9424", color: "#8fae94" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)" },
  OUTRO:    { bg: "#93a09f33", color: "#93a09f" },
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

  // Puxa alterações feitas direto no Google Agenda (máx. 1x/min por usuário)
  await pullGoogleChanges(session.user.id, orgId);

  // Auto-expire overdue deadlines
  await db.deadline.updateMany({
    where: { organizationId: orgId, status: "PENDENTE", date: { lt: now } },
    data: { status: "PERDIDO" },
  });

  // KPI counts (always)
  const kpiCountsPromise = Promise.all([
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
  const view: AgendaView =
    viewStr === "dia" || viewStr === "semana" || viewStr === "ano" ? viewStr : "mes";
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
  } else if (view === "ano") {
    rangeStart = new Date(Date.UTC(calYear, 0, 1));
    rangeEnd   = new Date(Date.UTC(calYear, 11, 31, 23, 59, 59, 999));
    headerLabel = `${calYear}`;
    prevHref = `?view=ano&month=${calYear - 1}-01`;
    nextHref = `?view=ano&month=${calYear + 1}-01`;
    todayHref = `?view=ano`;
    isCurrentPeriod = calYear === now.getUTCFullYear();
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

  const DAY_PAGE_SIZE = 5; // ponytail: dias por página; ajustar se ficar apertado na prática

  // Independente entre si — dispara junto em vez de serializar round trips
  const [[statsHoje, statsProximos, statsVencidos, statsConcluidos], viewDeadlines, cases, matchingDates] = await Promise.all([
    kpiCountsPromise,
    db.deadline.findMany({
      where: { organizationId: orgId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { id: true, title: true, date: true, type: true, status: true, description: true, caseId: true },
      orderBy: { date: "asc" },
    }),
    db.case.findMany({
      where: { organizationId: orgId },
      select: { id: true, number: true },
      orderBy: { number: "asc" },
    }),
    db.deadline.findMany({
      where: listWhere,
      select: { date: true },
      orderBy: { date: "asc" },
    }),
  ]);
  const uniqueDayKeys = Array.from(new Set(matchingDates.map((d) => dayKey(d.date))));
  const totalDays = uniqueDayKeys.length;
  const pageDayKeys = uniqueDayKeys.slice((page - 1) * DAY_PAGE_SIZE, page * DAY_PAGE_SIZE);

  const pageDeadlines = pageDayKeys.length
    ? await db.deadline.findMany({
        where: {
          ...listWhere,
          date: {
            gte: new Date(`${pageDayKeys[0]}T00:00:00.000Z`),
            lte: new Date(new Date(`${pageDayKeys[pageDayKeys.length - 1]}T00:00:00.000Z`).getTime() + 86400000 - 1),
          },
        },
        include: { case: true },
        orderBy: { date: "asc" },
      })
    : [];

  const groupedByDay = pageDayKeys.map((key) => ({
    key,
    date: new Date(`${key}T00:00:00.000Z`),
    items: pageDeadlines.filter((d) => dayKey(d.date) === key),
  }));

  const kpis = [
    { label: "Hoje",          value: statsHoje,      sub: "vence hoje",  accent: statsHoje > 0 ? "warn" : "none"   },
    { label: "Próximos 7d",   value: statsProximos,  sub: "pendentes",   accent: statsProximos > 0 ? "info" : "none" },
    { label: "Vencidos",      value: statsVencidos,  sub: "em aberto",   accent: statsVencidos > 0 ? "danger" : "none" },
    { label: "Concluídos",    value: statsConcluidos, sub: "no total",   accent: "none" },
  ];

  const accentStyle = (accent: string) => {
    if (accent === "warn")   return { bg: "linear-gradient(160deg, oklch(0.75 0.16 80 / 14%), #222f30)", border: "1px solid oklch(0.75 0.16 80 / 30%)", numColor: "#ffffff", subColor: "oklch(0.75 0.16 80)" };
    if (accent === "danger") return { bg: "linear-gradient(160deg, oklch(0.62 0.18 22 / 14%), #222f30)", border: "1px solid oklch(0.62 0.18 22 / 30%)", numColor: "#ffffff", subColor: "oklch(0.62 0.18 22)" };
    if (accent === "info")   return { bg: "linear-gradient(160deg, #cef79e24, #222f30)", border: "1px solid #cef79e4d", numColor: "#ffffff", subColor: "#cef79e" };
    return { bg: "#222f30", border: "1px solid #4d5757", numColor: "#ffffff", subColor: "#93a09f" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.5px", margin: 0 }}>
            Agenda
          </h1>
          <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
            Prazos, audiências e compromissos do escritório
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/agenda/novo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#cef79e", color: "#222f30",
              border: "none", borderRadius: 10, padding: "9px 16px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              textDecoration: "none",
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
              <p style={{ fontSize: 12, color: "#93a09f", marginBottom: 6 }}>{k.label}</p>
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

      <ViewTransition
        enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        default="none"
      >
        {view === "ano" && (
          <YearView year={calYear} deadlines={viewDeadlines} />
        )}

        {view === "mes" && (
          <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} cases={cases} />
        )}

        {view === "semana" && (
          <WeekView weekStart={formatDateParam(weekStart)} deadlines={viewDeadlines} cases={cases} />
        )}
        {view === "dia" && (
          <DayView day={formatDateParam(dayStart)} deadlines={viewDeadlines} cases={cases} />
        )}
      </ViewTransition>

      {/* ── Lista (visão secundária) ── */}
      <div style={{ borderTop: "1px solid #4d5757", paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Todos os prazos
        </h2>

        <>
          <Suspense>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <SearchFilters statusOptions={STATUS_OPTIONS} />
              <SearchFilters statusOptions={TYPE_OPTIONS} statusParam="type" />
            </div>
          </Suspense>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {groupedByDay.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "60px 32px", gap: 12,
                background: "#1a2425",
                border: "1px dashed #4d5757", borderRadius: 16,
              }}>
                <span style={{ fontSize: 32 }}>📅</span>
                <p style={{ fontSize: 14, color: "#93a09f", margin: 0 }}>Nenhum prazo encontrado.</p>
              </div>
            )}

            {groupedByDay.map((group) => (
              <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                  {formatRelativeDay(group.date, todayUTC)}
                </h3>

                {group.items.map((d) => {
                  const tc = TYPE_COLORS[d.type] ?? TYPE_COLORS.OUTRO;
                  const isLost = d.status === "PERDIDO";
                  const isDone = d.status === "CONCLUIDO";

                  return (
                    <div
                      key={d.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: "#222f30",
                        border: `1px solid ${isLost ? "color-mix(in oklab, var(--destructive) 20%, transparent)" : isDone ? "oklch(0.72 0.15 150 / 15%)" : "#4d5757"}`,
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
                        <p style={{ fontSize: 14, fontWeight: 500, color: isDone || isLost ? "#93a09f" : "#ffffff", textDecoration: isLost ? "line-through" : "none", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.title}
                        </p>
                        <p style={{ fontSize: 12, color: "#93a09f", marginTop: 3, fontFamily: "monospace" }}>
                          {d.case ? d.case.number : "Sem processo"} · {formatDate(d.date)}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {!isLost && !isDone && <RiskBadge date={d.date} type={d.type} status={d.status} />}
                        {isLost && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: "color-mix(in oklab, var(--destructive) 14%, transparent)", color: "var(--destructive)", borderRadius: 99, padding: "3px 10px" }}>Perdido</span>
                        )}
                        {isDone && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)", borderRadius: 99, padding: "3px 10px" }}>Concluído</span>
                        )}
                        <Link href={`/agenda/${d.id}`} style={{ fontSize: 12, color: "#93a09f", textDecoration: "none", padding: "5px 10px", borderRadius: 7, border: "1px solid #4d5757" }}>
                          Editar
                        </Link>
                        <DeleteButton action={deleteDeadline.bind(null, d.id)} label="Excluir" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <Suspense>
            <Pagination page={page} total={totalDays} pageSize={DAY_PAGE_SIZE} />
          </Suspense>
        </>
      </div>
    </div>
  );
}
