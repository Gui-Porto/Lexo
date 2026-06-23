import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { ViewToggle } from "./view-toggle";
import { KanbanBoard, type KanbanCase } from "./kanban-board";
import { TimelineView, type TimelineCase } from "./timeline-view";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "ARQUIVADO", label: "Arquivado" },
  { value: "ENCERRADO", label: "Encerrado" },
];

const AREA_COLORS: Record<string, string> = {
  Cível: "oklch(0.66 0.18 274)",
  Trabalhista: "oklch(0.65 0.15 200)",
  Tributário: "oklch(0.72 0.15 150)",
  Família: "oklch(0.75 0.16 80)",
  Criminal: "oklch(0.70 0.18 30)",
  Empresarial: "oklch(0.72 0.14 300)",
};

type View = "table" | "kanban" | "timeline";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; view?: string }>;
}) {
  const session = await requireSession();
  const { q, status, page: pageStr, view: viewParam } = await searchParams;
  const view: View = (viewParam === "kanban" || viewParam === "timeline") ? viewParam : "table";
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;
  const isAdvogado = session.user.role === "ADVOGADO";

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "ATIVO" | "SUSPENSO" | "ARQUIVADO" | "ENCERRADO" } : {}),
    AND: [
      ...(isAdvogado
        ? [{ OR: [{ responsavelId: session.user.id }, { responsavelId: null }] }]
        : []),
      ...(q
        ? [
            {
              OR: [
                { number: { contains: q, mode: "insensitive" as const } },
                { area: { contains: q, mode: "insensitive" as const } },
                { client: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            },
          ]
        : []),
    ],
  };

  const isAlt = view === "kanban" || view === "timeline";

  const baseQuery = {
    where,
    include: { client: true, responsavel: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  } as const;

  const [cases, total, statsAtivo, statsSuspenso, statsPrazosProximos] = isAlt
    ? await Promise.all([
        db.case.findMany({ ...baseQuery, take: 500 }),
        Promise.resolve(0),
        db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
        db.case.count({ where: { organizationId: orgId, status: "SUSPENSO" } }),
        db.deadline.count({
          where: {
            organizationId: orgId,
            status: "PENDENTE",
            date: { gte: now, lte: sevenDaysLater },
          },
        }),
      ])
    : await Promise.all([
        db.case.findMany({ ...baseQuery, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        db.case.count({ where }),
        db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
        db.case.count({ where: { organizationId: orgId, status: "SUSPENSO" } }),
        db.deadline.count({
          where: {
            organizationId: orgId,
            status: "PENDENTE",
            date: { gte: now, lte: sevenDaysLater },
          },
        }),
      ]);

  const kpis = [
    {
      label: "Processos ativos",
      value: statsAtivo,
      sub: "em andamento",
      accent: false,
    },
    {
      label: "Suspensos",
      value: statsSuspenso,
      sub: "aguardando movimentação",
      accent: false,
    },
    {
      label: "Prazos próximos",
      value: statsPrazosProximos,
      sub: "nos próximos 7 dias",
      accent: statsPrazosProximos > 0,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.5px", margin: 0 }}>
            Processos
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 4 }}>
            Gerencie todos os processos do escritório
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Suspense>
            <ViewToggle current={view} />
          </Suspense>
          <Link
            href="/processos/novo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "oklch(0.66 0.18 274)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              boxShadow: "0 4px 14px oklch(0.66 0.18 274 / 35%)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo processo
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: k.accent
                ? "linear-gradient(160deg, oklch(0.66 0.18 274 / 14%), oklch(0.155 0.02 264))"
                : "oklch(0.155 0.02 264)",
              border: k.accent
                ? "1px solid oklch(0.66 0.18 274 / 30%)"
                : "1px solid oklch(1 0 0 / 7%)",
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <p style={{ fontSize: 12, color: k.accent ? "oklch(0.70 0.04 274)" : "oklch(0.55 0.02 264)", marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: k.accent ? "oklch(0.97 0.01 264)" : "oklch(0.97 0.008 264)", letterSpacing: "-1px", margin: 0 }}>{k.value}</p>
            <p style={{ fontSize: 12, color: k.accent ? "oklch(0.75 0.16 50)" : "oklch(0.45 0.02 264)", marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Suspense>
        <SearchFilters statusOptions={STATUS_OPTIONS} />
      </Suspense>

      {/* Table view */}
      {view === "table" && (
        <>
          <div
            style={{
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 1fr",
                gap: 16,
                padding: "12px 20px",
                borderBottom: "1px solid oklch(1 0 0 / 7%)",
                background: "oklch(0.13 0.018 264)",
              }}
            >
              {["Número / Cliente", "Área", "Responsável", "Status"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "oklch(0.45 0.02 264)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {cases.length === 0 && (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "oklch(0.50 0.02 264)", fontSize: 14 }}>
                Nenhum processo encontrado.
              </div>
            )}
            {cases.map((c, i) => {
              const areaColor = AREA_COLORS[c.area ?? ""] ?? "oklch(0.55 0.02 264)";
              const statusColors: Record<string, { bg: string; color: string }> = {
                ATIVO: { bg: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)" },
                SUSPENSO: { bg: "oklch(0.75 0.16 50 / 14%)", color: "oklch(0.75 0.16 50)" },
                ARQUIVADO: { bg: "oklch(0.45 0.02 264 / 20%)", color: "oklch(0.55 0.02 264)" },
                ENCERRADO: { bg: "oklch(0.45 0.02 264 / 20%)", color: "oklch(0.55 0.02 264)" },
              };
              const sc = statusColors[c.status] ?? { bg: "oklch(0.22 0.018 264)", color: "oklch(0.55 0.02 264)" };

              return (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1.5fr 1fr",
                    gap: 16,
                    padding: "14px 20px",
                    borderBottom: i < cases.length - 1 ? "1px solid oklch(1 0 0 / 5%)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Link
                      href={`/processos/${c.id}`}
                      style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.90 0.01 264)", textDecoration: "none", fontFamily: "monospace" }}
                    >
                      {c.number}
                    </Link>
                    <p style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", marginTop: 2 }}>{c.client.name}</p>
                  </div>
                  <div>
                    {c.area ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: areaColor, flexShrink: 0 }} />
                        <span style={{ color: "oklch(0.78 0.01 264)" }}>{c.area}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "oklch(0.40 0.02 264)" }}>—</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "oklch(0.65 0.02 264)" }}>
                    {c.responsavel?.name ?? "—"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "3px 10px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 500,
                      background: sc.bg,
                      color: sc.color,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              );
            })}
          </div>

          <Suspense>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
          </Suspense>
        </>
      )}

      {view === "kanban" && (
        <KanbanBoard
          initialCases={
            cases.map((c) => ({
              id: c.id,
              number: c.number,
              area: c.area,
              status: c.status,
              client: { name: c.client.name },
              responsavel: c.responsavel ?? null,
            })) satisfies KanbanCase[]
          }
        />
      )}

      {view === "timeline" && (
        <TimelineView
          cases={
            cases.map((c) => ({
              id: c.id,
              number: c.number,
              area: c.area,
              status: c.status,
              createdAt: c.createdAt,
              client: { name: c.client.name },
            })) satisfies TimelineCase[]
          }
        />
      )}
    </div>
  );
}
