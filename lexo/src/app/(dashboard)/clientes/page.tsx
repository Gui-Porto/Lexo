import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { formatCurrency } from "@/lib/format";

const PAGE_SIZE = 18; // divisível por 3 colunas

const AVATAR_COLORS = [
  ["#2c3b3c", "#2c3b3c"],
  ["#283738", "#283738"],
  ["#6d7f78", "#6d7f78"],
  ["#4d5757", "#4d5757"],
  ["#8fae94", "#8fae94"],
  ["#1a2425", "#1a2425"],
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function isPJ(doc: string | null): boolean {
  if (!doc) return false;
  const digits = doc.replace(/\D/g, "");
  return digits.length === 14;
}

export default async function ClientesPage({
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
            { name: { contains: q, mode: "insensitive" as const } },
            { document: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { cases: true, invoices: true } },
        invoices: {
          where: { status: { in: ["PENDENTE", "ATRASADO"] } },
          select: { amount: true },
        },
      },
    }),
    db.client.count({ where }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.4px", margin: 0 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: "#93a09f", marginTop: 3 }}>
            {total} cliente{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <Suspense>
            <SearchFilters />
          </Suspense>
          <Link
            href="/clientes/novo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#cef79e", color: "#222f30",
              borderRadius: 9, padding: "9px 16px",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Novo cliente
          </Link>
        </div>
      </div>

      {/* Card grid */}
      {clients.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "80px 32px", gap: 12,
          background: "#1a2425", border: "1px dashed #4d5757",
          borderRadius: 16,
        }}>
          <span style={{ fontSize: 32 }}>👥</span>
          <p style={{ fontSize: 14, color: "#93a09f", margin: 0 }}>Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {clients.map((client, i) => {
            const [c1, c2] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const pj = isPJ(client.document);
            const totalAberto = client.invoices.reduce((s, inv) => s + Number(inv.amount), 0);
            const totalCases = client._count.cases;

            return (
              <div
                key={client.id}
                style={{
                  background: "#222f30",
                  border: "1px solid #4d5757",
                  borderRadius: 14, padding: 17,
                  display: "flex", flexDirection: "column",
                  transition: "border-color 0.15s",
                }}
              >
                {/* Avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 15 }}>
                  <span style={{
                    width: 44, height: 44,
                    borderRadius: pj ? 11 : "50%",
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}>
                    {pj ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/>
                        <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
                      </svg>
                    ) : (
                      <span style={{ font: "600 15px 'Geist', sans-serif" }}>{initials(client.name)}</span>
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#93a09f", marginTop: 2, fontFamily: "monospace" }}>
                      {pj ? "PJ" : "PF"}{client.document ? ` · ${client.document}` : ""}
                    </div>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: "#222f30", borderRadius: 9, padding: "9px 11px" }}>
                    <div style={{ fontSize: 10, color: "#93a09f", fontFamily: "monospace", letterSpacing: "0.05em" }}>PROCESSOS</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff", marginTop: 2 }}>{totalCases}</div>
                  </div>
                  <div style={{ flex: 1, background: "#222f30", borderRadius: 9, padding: "9px 11px" }}>
                    <div style={{ fontSize: 10, color: "#93a09f", fontFamily: "monospace", letterSpacing: "0.05em" }}>EM ABERTO</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: totalAberto > 0 ? "oklch(0.75 0.16 80)" : "oklch(0.72 0.15 150)", marginTop: 2 }}>
                      {totalAberto > 0 ? formatCurrency(totalAberto) : "—"}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderTop: "1px solid #4d5757", paddingTop: 12,
                }}>
                  <span style={{ fontSize: 12, color: "#93a09f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                    {client.email ?? client.phone ?? "Sem contato"}
                  </span>
                  <Link
                    href={`/clientes/${client.id}`}
                    style={{ fontSize: 12, fontWeight: 600, color: "#cef79e", textDecoration: "none", whiteSpace: "nowrap" }}
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Suspense>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
