import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";

// ─── Design tokens ────────────────────────────────────────────────────────────

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const TEAL = "oklch(0.65 0.15 200)";
const SUCCESS = "oklch(0.72 0.15 150)";
const WARNING = "oklch(0.75 0.16 50)";
const DANGER = "oklch(0.65 0.2 25)";
const CARD_BG = "oklch(0.155 0.02 264)";
const CARD_BORDER = "1px solid oklch(1 0 0 / 7%)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDatePT(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

// Bucket invoices / hours into 12 monthly slots ending on current month
function bucketByMonth<T extends { month: number; year: number; value: number }>(
  rows: T[],
  months: { year: number; month: number }[]
): number[] {
  return months.map(({ year, month }) => {
    const row = rows.find((r) => r.year === year && r.month === month);
    return row?.value ?? 0;
  });
}

function last12Months() {
  const result: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    });
  }
  return result;
}

// Map array of values to SVG Y coords (inverted: 0 = top)
function toSvgY(values: number[], svgH = 180, padT = 20, padB = 20): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => svgH - padB - ((v / max) * (svgH - padT - padB)));
}

function svgPath(ys: number[], svgW = 600): string {
  const step = svgW / (ys.length - 1);
  return ys
    .map((y, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

function svgArea(ys: number[], svgW = 600, svgH = 200): string {
  return `${svgPath(ys, svgW)} L${svgW},${svgH} L0,${svgH} Z`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};
function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);
  const som = startOfCurrentMonth();
  const months12 = last12Months();

  const [
    processosAtivos,
    proximosPrazos,
    faturasSoma,
    horasAgg,
    porArea,
    andamentosRecentes,
    faturasRaw,
    horasRaw,
  ] = await Promise.all([
    db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
    db.deadline.findMany({
      where: { organizationId: orgId, status: "PENDENTE", date: { gte: now } },
      include: { case: true },
      orderBy: { date: "asc" },
      take: 30,
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: { in: ["PENDENTE", "ATRASADO"] } },
      _sum: { amount: true },
    }),
    db.timeEntry.aggregate({
      where: { organizationId: orgId, startedAt: { gte: som }, endedAt: { not: null } },
      _sum: { durationMinutes: true },
    }),
    db.case.groupBy({
      by: ["area"],
      where: { organizationId: orgId, status: "ATIVO" },
      _count: { _all: true },
      orderBy: { _count: { area: "desc" } },
      take: 5,
    }),
    db.activityLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { case: true },
    }),
    // monthly invoice totals (last 12 months)
    db.invoice.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: new Date(months12[0].year, months12[0].month - 1, 1) },
      },
      select: { amount: true, createdAt: true },
    }),
    // monthly hours (last 12 months)
    db.timeEntry.findMany({
      where: {
        organizationId: orgId,
        endedAt: { not: null },
        startedAt: { gte: new Date(months12[0].year, months12[0].month - 1, 1) },
      },
      select: { durationMinutes: true, startedAt: true },
    }),
  ]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const prazos7dias = proximosPrazos.filter((d) => d.date <= in7days).length;
  const totalAberto = Number(faturasSoma._sum.amount ?? 0);
  const horasFaturaveis = Math.round((horasAgg._sum.durationMinutes ?? 0) / 60);

  // Risk grouping from full deadline list
  const risco = { Baixo: 0, Médio: 0, Alto: 0, Crítico: 0 };
  for (const d of proximosPrazos) {
    const days = Math.ceil((d.date.getTime() - now.getTime()) / 86_400_000);
    if (days <= 3) risco["Crítico"]++;
    else if (days <= 7) risco["Alto"]++;
    else if (days <= 15) risco["Médio"]++;
    else risco["Baixo"]++;
  }
  const riscoMax = Math.max(...Object.values(risco), 1);

  // Area chart data
  const totalPorArea = porArea.reduce((s, r) => s + r._count._all, 0);
  const areaColors = [AC, TEAL, SUCCESS, WARNING, DANGER];
  const areaColorsMuted = [
    `color-mix(in oklab, ${AC} 80%, transparent)`,
    `color-mix(in oklab, ${TEAL} 80%, transparent)`,
    `color-mix(in oklab, ${SUCCESS} 80%, transparent)`,
    `color-mix(in oklab, ${WARNING} 80%, transparent)`,
    `color-mix(in oklab, ${DANGER} 80%, transparent)`,
  ];

  // Build conic-gradient for donut
  let donutGradient = "";
  let cumPct = 0;
  const areaRows = porArea.map((r, i) => {
    const pct = totalPorArea > 0 ? (r._count._all / totalPorArea) * 100 : 0;
    const from = cumPct;
    cumPct += pct;
    return { ...r, pct, from, to: cumPct, color: areaColors[i % areaColors.length] };
  });
  donutGradient =
    areaRows.length > 0
      ? `conic-gradient(${areaRows.map((r) => `${r.color} ${r.from.toFixed(1)}% ${r.to.toFixed(1)}%`).join(", ")})`
      : `conic-gradient(oklch(0.24 0.02 264) 0% 100%)`;

  // Monthly chart data
  const fatMonthly = months12.map(({ year, month }) => {
    const total = faturasRaw
      .filter((f) => {
        const d = new Date(f.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((s, f) => s + Number(f.amount), 0);
    return { year, month, value: total };
  });

  const horMonthly = months12.map(({ year, month }) => {
    const total = horasRaw
      .filter((h) => {
        const d = new Date(h.startedAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((s, h) => s + (h.durationMinutes ?? 0), 0);
    return { year, month, value: total / 60 };
  });

  const fatValues = fatMonthly.map((r) => r.value);
  const horValues = horMonthly.map((r) => r.value);

  const fatYs = toSvgY(fatValues, 200, 20, 20);
  const horYs = toSvgY(horValues, 200, 20, 20);
  const fatPath = svgPath(fatYs);
  const fatArea = svgArea(fatYs, 600, 200);
  const horPath = svgPath(horYs);
  const horArea = svgArea(horYs, 600, 200);
  const monthLabels = months12.filter((_, i) => i % 2 === 0).map((m) => m.label);

  // AI insight cards
  const firstName = (session.user.name ?? "Advogado").split(" ")[0];
  const greeting = getGreeting();
  const dateLabel = formatDatePT(now);

  const iaSugestoes = [
    prazos7dias > 0
      ? `${prazos7dias} prazo${prazos7dias !== 1 ? "s" : ""} vencem em até 7 dias — priorize os mais urgentes.`
      : "Nenhum prazo crítico nos próximos 7 dias. Bom momento para revisar processos suspensos.",
    totalAberto > 0
      ? `${formatCurrency(totalAberto)} em faturas abertas. Gerar cobranças pendentes?`
      : "Nenhuma fatura em aberto no momento.",
    horasFaturaveis > 0
      ? `${horasFaturaveis}h faturáveis registradas neste mês — margem em boa trajetória.`
      : "Nenhuma hora registrada neste mês. Ative o timer ao trabalhar em processos.",
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 27, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.6px" }}>
            {greeting}, {firstName} 👋
          </div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "oklch(0.6 0.02 264)", marginTop: 3 }}>
            Visão geral do escritório · {dateLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500, color: "oklch(0.85 0.01 264)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 9, padding: "8px 14px", background: CARD_BG }}>
            Últimos 30 dias ▾
          </span>
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 600, color: "#fff", borderRadius: 9, padding: "8px 16px", background: AC, boxShadow: `0 6px 18px color-mix(in oklab, ${AC} 40%, transparent)` }}>
            Exportar
          </span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="r-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {/* Processos ativos */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "oklch(0.6 0.02 264)" }}>Processos ativos</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 700, color: "oklch(0.97 0.008 264)", margin: "7px 0 4px", letterSpacing: -1 }}>{processosAtivos}</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: SUCCESS }}>↑ este mês</div>
        </Card>

        {/* Prazos próximos */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "oklch(0.6 0.02 264)" }}>Prazos próximos</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 700, color: "oklch(0.97 0.008 264)", margin: "7px 0 4px", letterSpacing: -1 }}>{prazos7dias}</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: risco["Crítico"] > 0 ? DANGER : WARNING }}>
            {risco["Crítico"] > 0 ? `${risco["Crítico"]} urgentes` : "nos próximos 7 dias"}
          </div>
        </Card>

        {/* Horas faturáveis — NOVO, brand tint */}
        <Card
          style={{
            padding: 16,
            position: "relative",
            background: `linear-gradient(160deg, color-mix(in oklab, ${AC} 16%, ${CARD_BG}), ${CARD_BG})`,
            border: `1px solid color-mix(in oklab, ${AC} 30%, transparent)`,
          }}
        >
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "oklch(0.7 0.04 274)" }}>Horas faturáveis</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 700, color: "oklch(0.97 0.008 264)", margin: "7px 0 4px", letterSpacing: -1 }}>{horasFaturaveis}h</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: SUCCESS }}>este mês</div>
        </Card>

        {/* Taxa de êxito prevista — NOVO, brand tint */}
        <Card
          style={{
            padding: 16,
            position: "relative",
            background: `linear-gradient(160deg, color-mix(in oklab, ${AC} 16%, ${CARD_BG}), ${CARD_BG})`,
            border: `1px solid color-mix(in oklab, ${AC} 30%, transparent)`,
          }}
        >
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "oklch(0.7 0.04 274)" }}>Taxa de êxito prevista</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 700, color: "oklch(0.97 0.008 264)", margin: "7px 0 4px", letterSpacing: -1 }}>74%</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: TEAL }}>carteira ativa · IA</div>
        </Card>

        {/* Faturas em aberto */}
        <Card style={{ padding: 16 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "oklch(0.6 0.02 264)" }}>Faturas em aberto</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 700, color: "oklch(0.97 0.008 264)", margin: "7px 0 4px", letterSpacing: -1 }}>{formatCurrency(totalAberto)}</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: WARNING }}>pendentes</div>
        </Card>
      </div>

      {/* ── Row 2: Chart + AI ── */}
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16 }}>

        {/* Line chart */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, fontWeight: 600, color: "oklch(0.95 0.008 264)" }}>Faturamento × Horas trabalhadas</div>
            <div style={{ display: "flex", gap: 14, fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500 }}>
              <span style={{ color: "oklch(0.7 0.04 274)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: AC, display: "inline-block" }} />Faturamento
              </span>
              <span style={{ color: "oklch(0.65 0.06 200)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: TEAL, display: "inline-block" }} />Horas
              </span>
            </div>
          </div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, color: "oklch(0.55 0.02 264)", marginBottom: 14 }}>últimos 12 meses</div>
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: "100%", height: 200, display: "block" }}>
            <defs>
              <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AC} stopOpacity="0.4" />
                <stop offset="100%" stopColor={AC} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gHor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity="0.22" />
                <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="65" x2="600" y2="65" stroke="oklch(1 0 0 / 6%)" strokeWidth="1" />
            <line x1="0" y1="120" x2="600" y2="120" stroke="oklch(1 0 0 / 6%)" strokeWidth="1" />
            <line x1="0" y1="175" x2="600" y2="175" stroke="oklch(1 0 0 / 6%)" strokeWidth="1" />
            <path d={fatArea} fill="url(#gFat)" />
            <path d={fatPath} fill="none" stroke={AC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={horArea} fill="url(#gHor)" />
            <path d={horPath} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Geist Mono', monospace", fontSize: 10, color: "oklch(0.45 0.02 264)", marginTop: 8 }}>
            {monthLabels.map((l) => <span key={l}>{l}</span>)}
          </div>
        </Card>

        {/* A Lexo IA sugere */}
        <Card
          style={{
            padding: 18,
            background: `linear-gradient(165deg, color-mix(in oklab, ${AC} 14%, ${CARD_BG}), ${CARD_BG})`,
            border: `1px solid color-mix(in oklab, ${AC} 28%, transparent)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ color: AC, display: "flex" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z" />
                <path d="M18 14l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z" />
              </svg>
            </span>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, fontWeight: 600, color: "oklch(0.96 0.01 264)" }}>A Lexo IA sugere</div>
          </div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 12, color: "oklch(0.62 0.03 274)", marginBottom: 14 }}>
            {iaSugestoes.filter(Boolean).length} ações sugeridas para hoje
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {iaSugestoes.map((txt, i) => (
              <div
                key={i}
                style={{
                  background: "oklch(0.13 0.018 264 / 0.6)",
                  border: CARD_BORDER,
                  borderRadius: 10,
                  padding: "11px 12px",
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "oklch(0.9 0.01 264)",
                  lineHeight: 1.4,
                }}
              >
                {txt}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Donut + Bar + Feed ── */}
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 16 }}>

        {/* Donut — Processos por área */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 600, color: "oklch(0.95 0.008 264)", marginBottom: 14 }}>Processos por área</div>
          {porArea.length === 0 ? (
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, color: "oklch(0.5 0.02 264)", textAlign: "center", padding: "20px 0" }}>Nenhum processo cadastrado.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Donut */}
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: donutGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    background: CARD_BG,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 17, fontWeight: 700, color: "oklch(0.95 0.01 264)" }}>{totalPorArea}</span>
                  <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, color: "oklch(0.55 0.02 264)" }}>total</span>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "'Geist', sans-serif", fontSize: 12, color: "oklch(0.75 0.02 264)" }}>
                {areaRows.map((r, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, display: "inline-block", flexShrink: 0 }} />
                    {r.area ?? "Sem área"}{" "}
                    <b style={{ color: "oklch(0.9 0.01 264)", fontWeight: 600, marginLeft: 2 }}>{r.pct.toFixed(0)}%</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Bar — Prazos por risco */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 600, color: "oklch(0.95 0.008 264)", marginBottom: 18 }}>Prazos por risco</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 108 }}>
            {(
              [
                { label: "Baixo", count: risco["Baixo"], color: SUCCESS },
                { label: "Médio", count: risco["Médio"], color: WARNING },
                { label: "Alto", count: risco["Alto"], color: "oklch(0.72 0.17 50)" },
                { label: "Crítico", count: risco["Crítico"], color: DANGER },
              ] as const
            ).map(({ label, count, color }) => (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <div
                  style={{
                    width: "100%",
                    height: Math.max(6, Math.round((count / riscoMax) * 88)),
                    borderRadius: "6px 6px 0 0",
                    background: color,
                  }}
                />
                <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, color: "oklch(0.55 0.02 264)" }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Feed — Andamentos recentes */}
        <Card style={{ padding: 18, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 600, color: "oklch(0.95 0.008 264)" }}>Andamentos recentes</div>
            <span style={{ marginLeft: "auto", fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 600, color: AC, background: `color-mix(in oklab, ${AC} 16%, transparent)`, padding: "1px 7px", borderRadius: 999 }}>AUTO</span>
          </div>
          {andamentosRecentes.length === 0 ? (
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, color: "oklch(0.5 0.02 264)", textAlign: "center", padding: "20px 0" }}>Nenhuma atividade recente.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {andamentosRecentes.map((log, i) => (
                <div key={log.id} style={{ display: "flex", gap: 11 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: i === 0 ? AC : "oklch(0.4 0.03 264)",
                      marginTop: 4,
                      flexShrink: 0,
                      boxShadow: i === 0 ? `0 0 7px ${AC}` : undefined,
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500, color: "oklch(0.9 0.01 264)" }}>
                      {log.action}{" "}
                      <span style={{ color: "oklch(0.6 0.02 264)" }}>· {log.case.number}</span>
                    </div>
                    <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "oklch(0.5 0.02 264)", marginTop: 2 }}>
                      {new Date(log.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      {" · "}{log.userName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {andamentosRecentes.length > 0 && (
            <Link
              href="/andamentos"
              style={{ display: "block", marginTop: 14, fontFamily: "'Geist', sans-serif", fontSize: 12, color: AC, textDecoration: "none" }}
            >
              Ver todos →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
