import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { ViewToggle } from "./view-toggle";
import { KanbanBoard, type KanbanCase } from "./kanban-board";
import { TimelineView, type TimelineCase } from "./timeline-view";
import { formatDate } from "@/lib/format";

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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ATIVO:     { bg: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)" },
  SUSPENSO:  { bg: "oklch(0.75 0.16 50 / 14%)",  color: "oklch(0.75 0.16 50)"  },
  ARQUIVADO: { bg: "oklch(0.45 0.02 264 / 20%)", color: "oklch(0.55 0.02 264)" },
  ENCERRADO: { bg: "oklch(0.45 0.02 264 / 20%)", color: "oklch(0.55 0.02 264)" },
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

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "ATIVO" | "SUSPENSO" | "ARQUIVADO" | "ENCERRADO" } : {}),
    AND: [
      ...(isAdvogado
        ? [{ OR: [{ responsavelId: session.user.id }, { responsavelId: null }] }]
        : []),
      ...(q
        ? [{ OR: [
            { number: { contains: q, mode: "insensitive" as const } },
            { area: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
          ] }]
        : []),
    ],
  };

  const isAlt = view === "kanban" || view === "timeline";

  const include = {
    client: true,
    responsavel: { select: { name: true } },
    deadlines: {
      where: { status: "PENDENTE" as const, date: { gte: now } },
      orderBy: { date: "asc" as const },
      take: 1,
      select: { date: true },
    },
  } as const;

  const [cases, total, kAtivo, kSuspenso, kArquivado, kPrazos] = await Promise.all([
    isAlt
      ? db.case.findMany({ where, include, orderBy: { createdAt: "desc" }, take: 500 })
      : db.case.findMany({ where, include, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    isAlt ? Promise.resolve(0) : db.case.count({ where }),
    db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
    db.case.count({ where: { organizationId: orgId, status: "SUSPENSO" } }),
    db.case.count({ where: { organizationId: orgId, status: "ARQUIVADO" } }),
    db.deadline.count({ where: { organizationId: orgId, status: "PENDENTE" } }),
  ]);

  const totalCases = kAtivo + kSuspenso + kArquivado;

  const kpis = [
    { label: "Ativos",         value: kAtivo,    sub: null },
    { label: "Suspensos",      value: kSuspenso, sub: null },
    { label: "Arquivados",     value: kArquivado,sub: null },
    { label: "Prazos abertos", value: kPrazos,   sub: null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.4px", margin: 0 }}>
            Processos
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.60 0.02 264)", marginTop: 3 }}>
            {totalCases} processos · {kAtivo} ativos · acompanhados nos tribunais com prazos vinculados
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <Suspense><ViewToggle current={view} /></Suspense>
          <Link
            href="/processos/novo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "oklch(0.66 0.18 274)", color: "#fff",
              borderRadius: 9, padding: "8px 16px",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 6px 18px oklch(0.66 0.18 274 / 40%)",
            }}
          >
            + Novo processo
          </Link>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: 14, padding: "15px 16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: "oklch(0.60 0.02 264)" }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "oklch(0.97 0.008 264)", marginTop: 5, letterSpacing: "-1px" }}>{k.value}</div>
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
          <div className="r-tablewrap" style={{ background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 14, overflow: "hidden" }}>
            {/* Header row */}
            <div className="r-tablegrid" style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.5fr 1.1fr 1.2fr 0.9fr 0.9fr",
              gap: 12, padding: "13px 18px",
              borderBottom: "1px solid oklch(1 0 0 / 7%)",
              background: "oklch(0.13 0.018 264)",
            }}>
              {["PROCESSO", "CLIENTE", "ÁREA", "RESPONSÁVEL", "PRÓX. PRAZO", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.50 0.02 264)", letterSpacing: "0.05em", fontFamily: "monospace" }}>
                  {h}
                </span>
              ))}
            </div>

            {cases.length === 0 && (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "oklch(0.50 0.02 264)", fontSize: 14 }}>
                Nenhum processo encontrado.
              </div>
            )}

            {cases.map((c, i) => {
              const areaColor = AREA_COLORS[c.area ?? ""] ?? "oklch(0.55 0.02 264)";
              const sc = STATUS_STYLE[c.status] ?? STATUS_STYLE.ENCERRADO;
              const nextDeadline = c.deadlines[0]?.date ?? null;

              return (
                <div
                  key={c.id}
                  className="r-tablegrid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1.5fr 1.1fr 1.2fr 0.9fr 0.9fr",
                    gap: 12, padding: "14px 18px",
                    borderBottom: i < cases.length - 1 ? "1px solid oklch(1 0 0 / 5%)" : "none",
                    alignItems: "center",
                  }}
                >
                  <Link
                    href={`/processos/${c.id}`}
                    style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.88 0.01 264)", textDecoration: "none", fontFamily: "monospace" }}
                  >
                    {c.number}
                  </Link>
                  <span style={{ fontSize: 13, color: "oklch(0.75 0.01 264)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.client.name}
                  </span>
                  <span>
                    {c.area ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: areaColor, flexShrink: 0 }} />
                        <span style={{ color: "oklch(0.75 0.01 264)" }}>{c.area}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "oklch(0.40 0.02 264)" }}>—</span>
                    )}
                  </span>
                  <span style={{ fontSize: 12, color: "oklch(0.65 0.02 264)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.responsavel?.name ?? "—"}
                  </span>
                  <span style={{ fontSize: 12, color: nextDeadline ? "oklch(0.75 0.16 50)" : "oklch(0.40 0.02 264)", fontFamily: "monospace" }}>
                    {nextDeadline ? formatDate(nextDeadline) : "—"}
                  </span>
                  <span style={{
                    display: "inline-flex", padding: "3px 10px", borderRadius: 99,
                    fontSize: 11, fontWeight: 500,
                    background: sc.bg, color: sc.color,
                  }}>
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
          initialCases={cases.map((c) => ({
            id: c.id, number: c.number, area: c.area, status: c.status,
            client: { name: c.client.name },
            responsavel: c.responsavel ?? null,
          })) satisfies KanbanCase[]}
        />
      )}

      {view === "timeline" && (
        <TimelineView
          cases={cases.map((c) => ({
            id: c.id, number: c.number, area: c.area, status: c.status,
            createdAt: c.createdAt, client: { name: c.client.name },
          })) satisfies TimelineCase[]}
        />
      )}
    </div>
  );
}
