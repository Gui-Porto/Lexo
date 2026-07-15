import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { Activity } from "lucide-react";

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

type IconConfig = { symbol: string; color: string; bg: string; border: string };

function iconForAction(action: string): IconConfig {
  const a = action.toLowerCase();
  if (a.includes("criado"))
    return { symbol: "＋", color: "oklch(0.62 0.18 150)", bg: "oklch(0.62 0.18 150 / 12%)", border: "oklch(0.62 0.18 150 / 22%)" };
  if (a.includes("status"))
    /* FIXME(theme): hue 215 não coberto pelas regras (nem 264/274/300/30/50/200); tratado como categórico, igual ao hue 200 */
    return { symbol: "↺", color: "#8fae94", bg: "#8fae941f", border: "#8fae9438" };
  if (a.includes("prazo") || a.includes("audiência") || a.includes("audiencia"))
    return { symbol: "⏱", color: "oklch(0.75 0.16 80)", bg: "oklch(0.75 0.16 80 / 10%)", border: "oklch(0.75 0.16 80 / 20%)" };
  if (a.includes("encerrado") || a.includes("arquivado"))
    return { symbol: "✓", color: "#cef79e", bg: "#cef79e1f", border: "#cef79e38" };
  if (a.includes("excluído") || a.includes("removido"))
    return { symbol: "−", color: "oklch(0.62 0.20 20)", bg: "oklch(0.62 0.20 20 / 10%)", border: "oklch(0.62 0.20 20 / 20%)" };
  return { symbol: "•", color: "#93a09f", bg: "#283738", border: "#4d5757" };
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

  // Agrupar por dia
  const groups: Map<string, typeof logs> = new Map();
  for (const log of logs) {
    const key = dayKey(log.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  const AC = "#cef79e";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#cef79e24",
              border: "1px solid #cef79e40",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Activity size={18} color="#cef79e" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.4px", margin: 0 }}>
              Andamentos
            </h1>
            <p style={{ fontSize: 13, color: "#93a09f", marginTop: 2 }}>
              Histórico de movimentações do escritório
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Suspense fallback={null}>
            <SearchFilters />
          </Suspense>
          <span
            style={{
              fontSize: 12,
              color: "#93a09f",
              background: "#222f30",
              border: "1px solid #4d5757",
              borderRadius: 8,
              padding: "6px 12px",
              whiteSpace: "nowrap",
            }}
          >
            {total} movimentaç{total === 1 ? "ão" : "ões"}
          </span>
        </div>
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
            background: "#1a2425",
            border: "1px dashed #283738", /* FIXME(theme): L=0.25 fora das faixas definidas, aproximado pelo tom mais claro do fundo */
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#cef79e1a",
              border: "1px solid #cef79e33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={22} color="#cef79e" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#93a09f", margin: 0 }}>
              {q ? "Nenhum resultado encontrado" : "Nenhum andamento registrado"}
            </p>
            <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
              {q
                ? "Tente outro termo de busca."
                : "As movimentações aparecerão aqui conforme os processos forem atualizados."}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Array.from(groups.entries()).map(([day, entries]) => (
            <div key={day}>
              {/* Divisor do dia */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#93a09f",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  {formatDayLabel(day)}
                </span>
                <div style={{ flex: 1, height: 1, background: "#283738" }} />
                <span style={{ fontSize: 11, color: "#93a09f", whiteSpace: "nowrap" }}>
                  {entries.length} movimentaç{entries.length === 1 ? "ão" : "ões"}
                </span>
              </div>

              {/* Cartão do grupo */}
              <div
                style={{
                  background: "#222f30",
                  border: "1px solid #283738",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {entries.map((log, i) => {
                  const { symbol, color, bg, border } = iconForAction(log.action);
                  const isLast = i === entries.length - 1;
                  const timeOnly = formatDateTime(log.createdAt).split(", ")[1] ?? formatDateTime(log.createdAt);

                  return (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        gap: 14,
                        padding: "14px 20px",
                        alignItems: "flex-start",
                        borderBottom: isLast ? "none" : "1px solid #222f30",
                      }}
                    >
                      {/* Ícone */}
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: bg,
                          border: `1px solid ${border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          color,
                          flexShrink: 0,
                          marginTop: 1,
                          fontFamily: "monospace",
                        }}
                      >
                        {symbol}
                      </div>

                      {/* Conteúdo */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#ffffff", margin: 0, lineHeight: 1.4 }}>
                          {log.action}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                          <Link
                            href={`/processos/${log.case.id}`}
                            style={{
                              fontSize: 12,
                              color: AC,
                              textDecoration: "none",
                              fontFamily: "'Geist Mono', monospace",
                              fontWeight: 500,
                            }}
                          >
                            {log.case.number}
                          </Link>
                          {log.case.area && (
                            <span
                              style={{
                                fontSize: 11,
                                background: "#283738",
                                color: "#93a09f",
                                borderRadius: 5,
                                padding: "2px 7px",
                                border: "1px solid #4d5757",
                              }}
                            >
                              {log.case.area}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: "#93a09f" }}>·</span>
                          <span style={{ fontSize: 12, color: "#93a09f" }}>
                            {log.userName}
                          </span>
                        </div>
                      </div>

                      {/* Hora */}
                      <span
                        style={{
                          fontSize: 11,
                          color: "#93a09f",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          marginTop: 2,
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "'Geist Mono', monospace",
                        }}
                      >
                        {timeOnly}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      <Suspense fallback={null}>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
