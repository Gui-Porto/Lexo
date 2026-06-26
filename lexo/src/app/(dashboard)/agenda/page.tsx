import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeleteButton } from "@/components/delete-button";
import { DeadlineToggle } from "@/components/agenda/deadline-toggle";
import { RiskBadge } from "@/components/agenda/risk-badge";
import { CalendarView } from "@/components/agenda/calendar-view";
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
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string; view?: string; month?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const { q, status, type, page: pageStr, view, month: monthStr } = sp;

  const isCalendar = view === "calendar";
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

  // Calendar view: fetch deadlines for the month
  let calendarDeadlines: { id: string; title: string; date: Date; type: string; status: string }[] = [];
  if (isCalendar) {
    const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
    const monthEnd   = new Date(Date.UTC(calYear, calMonth + 1, 0, 23, 59, 59, 999));
    calendarDeadlines = await db.deadline.findMany({
      where: { organizationId: orgId, date: { gte: monthStart, lte: monthEnd } },
      select: { id: true, title: true, date: true, type: true, status: true },
      orderBy: { date: "asc" },
    });
  }

  // List view: filtered + paginated
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

  let deadlines: { id: string; title: string; date: Date; type: string; status: string; description: string | null; case: { number: string } }[] = [];
  let total = 0;
  if (!isCalendar) {
    [deadlines, total] = await Promise.all([
      db.deadline.findMany({
        where: listWhere,
        include: { case: true },
        orderBy: { date: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.deadline.count({ where: listWhere }),
    ]);
  }

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

  const toggleBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
    textDecoration: "none", border: "1px solid transparent",
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
          {/* View toggle */}
          <div style={{ display: "flex", background: "oklch(0.11 0.016 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 10, padding: 3 }}>
            <Link
              href="/agenda"
              style={{
                ...toggleBase,
                background: !isCalendar ? "oklch(0.155 0.02 264)" : "transparent",
                color: !isCalendar ? "oklch(0.92 0.01 264)" : "oklch(0.50 0.02 264)",
                border: !isCalendar ? "1px solid oklch(1 0 0 / 8%)" : "1px solid transparent",
                boxShadow: !isCalendar ? "0 1px 4px oklch(0 0 0 / 20%)" : "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Lista
            </Link>
            <Link
              href={`/agenda?view=calendar&month=${calMonthParam}`}
              style={{
                ...toggleBase,
                background: isCalendar ? "oklch(0.155 0.02 264)" : "transparent",
                color: isCalendar ? "oklch(0.92 0.01 264)" : "oklch(0.50 0.02 264)",
                border: isCalendar ? "1px solid oklch(1 0 0 / 8%)" : "1px solid transparent",
                boxShadow: isCalendar ? "0 1px 4px oklch(0 0 0 / 20%)" : "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendário
            </Link>
          </div>

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

      {/* ── Calendar view ── */}
      {isCalendar && (
        <CalendarView
          year={calYear}
          month={calMonth}
          deadlines={calendarDeadlines}
          currentMonthParam={calMonthParam}
        />
      )}

      {/* ── List view ── */}
      {!isCalendar && (
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
                      {d.case.number} · {formatDate(d.date)}
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
      )}
    </div>
  );
}
