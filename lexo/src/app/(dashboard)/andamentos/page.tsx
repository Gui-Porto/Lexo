import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (dateStr === toKey(today)) return "Hoje";
  if (dateStr === toKey(yesterday)) return "Ontem";

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function dayKey(date: Date): string {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Maps keywords in `action` to icon + color config
function iconForAction(action: string): { symbol: string; color: string; bg: string } {
  const a = action.toLowerCase();
  if (a.includes("criado")) return { symbol: "＋", color: "#059669", bg: "rgb(5 150 105 / 0.12)" };
  if (a.includes("status")) return { symbol: "↺", color: "#0891b2", bg: "rgb(8 145 178 / 0.12)" };
  if (a.includes("prazo") || a.includes("audiência") || a.includes("audiencia"))
    return { symbol: "⏱", color: "#d97706", bg: "rgb(217 119 6 / 0.10)" };
  if (a.includes("encerrado") || a.includes("arquivado"))
    return { symbol: "✓", color: "#7c3aed", bg: "rgb(124 58 237 / 0.10)" };
  if (a.includes("excluído") || a.includes("removido"))
    return { symbol: "−", color: "#be123c", bg: "rgb(190 18 60 / 0.10)" };
  return { symbol: "•", color: "#64748b", bg: "rgb(100 116 139 / 0.10)" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AndamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  const where = {
    organizationId: orgId,
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" as const } },
            { case: { number: { contains: q, mode: "insensitive" as const } } },
            { userName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { case: { select: { id: true, number: true, area: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.activityLog.count({ where }),
  ]);

  // Group by day
  const groups: Map<string, typeof logs> = new Map();
  for (const log of logs) {
    const key = dayKey(log.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  const AC = "oklch(0.66 0.18 274)";
  const AC2 = "oklch(0.72 0.14 300)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${AC}, ${AC2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Andamentos
          </h1>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: `${AC}18`,
              color: "oklch(0.72 0.18 274)",
              border: `1px solid ${AC}30`,
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            NOVO
          </span>
        </div>
        <p style={{ fontSize: 14, color: "oklch(0.55 0.02 264)" }}>
          Histórico de movimentações de todos os processos do escritório.
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>

        <span style={{ fontSize: 13, color: "oklch(0.45 0.02 264)" }}>
          {total} movimentaç{total === 1 ? "ão" : "ões"}
        </span>
      </div>

      {/* Timeline */}
      {logs.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px",
            gap: 16,
            background: "oklch(0.09 0.015 264)",
            border: "1px dashed oklch(0.25 0.018 264)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `${AC}12`,
              border: `1px solid ${AC}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📋
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>
              {q ? "Nenhum resultado encontrado" : "Nenhum andamento registrado"}
            </p>
            <p style={{ fontSize: 13, color: "oklch(0.45 0.02 264)", marginTop: 4 }}>
              {q
                ? `Tente outro termo de busca.`
                : "As movimentações aparecerão aqui conforme os processos forem atualizados."}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Array.from(groups.entries()).map(([day, entries]) => (
            <div key={day}>
              {/* Day label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "oklch(0.55 0.02 264)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDayLabel(day)}
                </span>
                <div style={{ flex: 1, height: 1, background: "oklch(0.22 0.018 264)" }} />
              </div>

              {/* Entries */}
              <div
                style={{
                  background: "oklch(0.115 0.018 264)",
                  border: "1px solid oklch(0.22 0.018 264)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {entries.map((log, i) => {
                  const { symbol, color, bg } = iconForAction(log.action);
                  const isLast = i === entries.length - 1;
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        gap: 16,
                        padding: "16px 24px",
                        borderBottom: isLast ? "none" : "1px solid oklch(0.18 0.015 264)",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: bg,
                          border: `1px solid ${color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          color,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {symbol}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>
                            {log.action}
                          </span>
                          {/* AUTO badge para ações futuras do tribunal */}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/processos/${log.case.id}`}
                            style={{
                              fontSize: 12,
                              color: AC,
                              textDecoration: "none",
                              fontFamily: "monospace",
                              fontWeight: 500,
                            }}
                          >
                            {log.case.number}
                          </Link>
                          {log.case.area && (
                            <span
                              style={{
                                fontSize: 11,
                                background: "oklch(0.20 0.018 264)",
                                color: "oklch(0.55 0.02 264)",
                                borderRadius: 4,
                                padding: "1px 6px",
                              }}
                            >
                              {log.case.area}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: "oklch(0.45 0.02 264)" }}>·</span>
                          <span style={{ fontSize: 12, color: "oklch(0.50 0.02 264)" }}>
                            {log.userName}
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <span
                        style={{
                          fontSize: 12,
                          color: "oklch(0.40 0.02 264)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          marginTop: 2,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatDateTime(log.createdAt).split(", ")[1] ?? formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Suspense fallback={null}>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
