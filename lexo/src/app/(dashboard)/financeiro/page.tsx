import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeleteButton } from "@/components/delete-button";
import { MarkPaidButton } from "@/components/financeiro/mark-paid-button";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { deleteInvoice } from "@/actions/financeiro";
import { formatDate, formatCurrency } from "@/lib/format";
import { ExportReport } from "@/components/financeiro/export-report";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "ATRASADO", label: "Atrasado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PAGO:      { bg: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)" },
  PENDENTE:  { bg: "oklch(0.75 0.16 80 / 14%)",  color: "oklch(0.75 0.16 80)"  },
  ATRASADO:  { bg: "color-mix(in oklab, var(--destructive) 14%, transparent)", color: "var(--destructive)" },
  CANCELADO: { bg: "#93a09f33", color: "#93a09f" },
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, status, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO" } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, total, aggPendente, aggPago, aggAtrasado, pagoMes] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { client: true, case: true },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.invoice.count({ where }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: "PENDENTE" },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: "PAGO" },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: "ATRASADO" },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: "PAGO", updatedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const totalPendente = Number(aggPendente._sum.amount ?? 0);
  const totalPago = Number(aggPago._sum.amount ?? 0);
  const totalAtrasado = Number(aggAtrasado._sum.amount ?? 0);
  const totalPagoMes = Number(pagoMes._sum.amount ?? 0);

  const kpis = [
    {
      label: "A receber",
      value: formatCurrency(totalPendente),
      sub: "em aberto",
      accent: "none",
    },
    {
      label: "Recebido este mês",
      value: formatCurrency(totalPagoMes),
      sub: "já pago",
      accent: "success",
    },
    {
      label: "Em atraso",
      value: formatCurrency(totalAtrasado),
      sub: "requer atenção",
      accent: totalAtrasado > 0 ? "danger" : "none",
    },
    {
      label: "Total recebido",
      value: formatCurrency(totalPago),
      sub: "histórico",
      accent: "none",
    },
  ];

  const accentStyle = (accent: string) => {
    if (accent === "success") return { bg: "linear-gradient(160deg, oklch(0.72 0.15 150 / 14%), #222f30)", border: "1px solid oklch(0.72 0.15 150 / 28%)", subColor: "oklch(0.72 0.15 150)" };
    if (accent === "danger") return { bg: "linear-gradient(160deg, color-mix(in oklab, var(--destructive) 14%, transparent), #222f30)", border: "1px solid color-mix(in oklab, var(--destructive) 28%, transparent)", subColor: "var(--destructive)" };
    return { bg: "#222f30", border: "1px solid #4d5757", subColor: "#93a09f" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.5px", margin: 0 }}>
            Financeiro
          </h1>
          <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
            Honorários, faturas e controle de recebimentos
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ExportReport />
          <Link
            href="/financeiro/novo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#cef79e",
              color: "#222f30",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo honorário
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => {
          const s = accentStyle(k.accent);
          return (
            <div
              key={k.label}
              style={{
                background: s.bg,
                border: s.border,
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontSize: 12, color: "#93a09f", marginBottom: 6 }}>{k.label}</p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {k.value}
              </p>
              <p style={{ fontSize: 12, color: s.subColor, marginTop: 4 }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <Suspense>
        <SearchFilters statusOptions={STATUS_OPTIONS} />
      </Suspense>

      {/* Table */}
      <div
        className="r-tablewrap"
        style={{
          background: "#222f30",
          border: "1px solid #4d5757",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="r-tablegrid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.1fr 1fr 120px",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid #4d5757",
            background: "#222f30",
          }}
        >
          {["Descrição", "Cliente", "Processo", "Valor", "Vencimento", "Status", ""].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#93a09f",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {invoices.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#93a09f", fontSize: 14 }}>
            Nenhum honorário encontrado.
          </div>
        )}

        {invoices.map((inv, i) => {
          const sc = STATUS_STYLE[inv.status] ?? STATUS_STYLE.CANCELADO;
          return (
            <div
              key={inv.id}
              className="r-tablegrid"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.1fr 1fr 120px",
                gap: 12,
                padding: "14px 20px",
                borderBottom: i < invoices.length - 1 ? "1px solid #4d5757" : "none",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inv.description}
              </span>
              <span style={{ fontSize: 12, color: "#93a09f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inv.client.name}
              </span>
              <span style={{ fontSize: 12, color: "#93a09f", fontFamily: "monospace" }}>
                {inv.case?.number ?? "—"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(Number(inv.amount))}
              </span>
              <span style={{ fontSize: 12, color: "#93a09f" }}>
                {formatDate(inv.dueDate)}
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
                {inv.status}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                {inv.status !== "PAGO" && <MarkPaidButton invoiceId={inv.id} />}
                <Link
                  href={`/financeiro/${inv.id}`}
                  style={{
                    fontSize: 11,
                    color: "#93a09f",
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #4d5757",
                  }}
                >
                  Editar
                </Link>
                <DeleteButton action={deleteInvoice.bind(null, inv.id)} label="Excluir" />
              </div>
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
