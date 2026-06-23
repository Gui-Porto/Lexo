import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 20;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "oklch(0.66 0.18 274)",
  "oklch(0.65 0.15 200)",
  "oklch(0.72 0.15 150)",
  "oklch(0.75 0.16 80)",
  "oklch(0.72 0.14 300)",
  "oklch(0.70 0.18 30)",
];

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

  const [clients, total, totalClients, totalCasosAtivos] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { cases: true } },
        cases: {
          where: { status: "ATIVO" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.client.count({ where }),
    db.client.count({ where: { organizationId: orgId } }),
    db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
  ]);

  const kpis = [
    { label: "Total de clientes", value: totalClients, sub: "cadastrados" },
    { label: "Casos ativos", value: totalCasosAtivos, sub: "em andamento" },
    { label: "Nesta página", value: clients.length, sub: `de ${total} encontrados` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.5px", margin: 0 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 4 }}>
            Gerencie a carteira de clientes do escritório
          </p>
        </div>
        <Link
          href="/clientes/novo"
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
          Novo cliente
        </Link>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <p style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-1px", margin: 0 }}>{k.value}</p>
            <p style={{ fontSize: 12, color: "oklch(0.45 0.02 264)", marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Suspense>
        <SearchFilters />
      </Suspense>

      {/* Client grid/list */}
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
            gridTemplateColumns: "2.5fr 1.5fr 2fr 1fr 120px",
            gap: 16,
            padding: "12px 20px",
            borderBottom: "1px solid oklch(1 0 0 / 7%)",
            background: "oklch(0.13 0.018 264)",
          }}
        >
          {["Cliente", "Documento", "Contato", "Processos", ""].map((h) => (
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

        {clients.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "oklch(0.50 0.02 264)", fontSize: 14 }}>
            Nenhum cliente encontrado.
          </div>
        )}

        {clients.map((client, i) => {
          const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const activeCases = client.cases.length;
          const totalCases = client._count.cases;

          return (
            <div
              key={client.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1.5fr 2fr 1fr 120px",
                gap: 16,
                padding: "14px 20px",
                borderBottom: i < clients.length - 1 ? "1px solid oklch(1 0 0 / 5%)" : "none",
                alignItems: "center",
              }}
            >
              {/* Name + avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials(client.name)}
                </div>
                <div>
                  <Link
                    href={`/clientes/${client.id}`}
                    style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.90 0.01 264)", textDecoration: "none" }}
                  >
                    {client.name}
                  </Link>
                  {client.email && (
                    <p style={{ fontSize: 11, color: "oklch(0.50 0.02 264)", marginTop: 1 }}>{client.email}</p>
                  )}
                </div>
              </div>

              <span style={{ fontSize: 12, color: "oklch(0.60 0.02 264)", fontFamily: "monospace" }}>
                {client.document ?? "—"}
              </span>

              <span style={{ fontSize: 12, color: "oklch(0.60 0.02 264)" }}>
                {client.phone ?? client.email ?? "—"}
              </span>

              {/* Case count */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.90 0.01 264)" }}>{totalCases}</span>
                {activeCases > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: "oklch(0.72 0.15 150 / 14%)",
                      color: "oklch(0.72 0.15 150)",
                      borderRadius: 99,
                      padding: "2px 7px",
                    }}
                  >
                    {activeCases} ativo{activeCases !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Action */}
              <Link
                href={`/clientes/${client.id}`}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "oklch(0.66 0.18 274)",
                  textDecoration: "none",
                  border: "1px solid oklch(0.66 0.18 274 / 30%)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                Ver detalhes
              </Link>
            </div>
          );
        })}
      </div>

      <Suspense>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
