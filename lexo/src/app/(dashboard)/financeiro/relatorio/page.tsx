import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { formatDate, formatCurrency } from "@/lib/format";
import { PrintButton } from "@/components/financeiro/print-button";

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; status?: string }>;
}) {
  const session = await requireSession();
  const { startDate, endDate, status } = await searchParams;
  const orgId = session.user.organizationId;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const where: Record<string, unknown> = { organizationId: orgId };
  if (status) where.status = status;
  if (startDate || endDate) {
    where.dueDate = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + "T23:59:59Z") } : {}),
    };
  }

  const invoices = await db.invoice.findMany({
    where,
    include: { client: true, case: { select: { number: true } } },
    orderBy: { dueDate: "asc" },
  });

  const totalGeral = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPago = invoices
    .filter((inv) => inv.status === "PAGO")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPendente = invoices
    .filter((inv) => inv.status === "PENDENTE" || inv.status === "ATRASADO")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const periodo =
    startDate || endDate
      ? `${startDate ? new Date(startDate).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "início"} a ${endDate ? new Date(endDate + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "hoje"}`
      : "Todos os períodos";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-1">{org?.name}</p>
            <p className="text-sm text-muted-foreground">Período: {periodo}</p>
          </div>
          <PrintButton />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total geral", value: totalGeral, color: "oklch(0.66 0.18 274)" },
            { label: "Recebido (PAGO)", value: totalPago, color: "oklch(0.65 0.15 150)" },
            { label: "A receber", value: totalPendente, color: "oklch(0.65 0.15 55)" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{ background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)" }}
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: card.color }}>
                {formatCurrency(card.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "2px solid oklch(0.66 0.18 274 / 0.4)" }}>
              {["Descrição", "Cliente", "Processo", "Vencimento", "Valor", "Status"].map((h) => (
                <th key={h} className="text-left py-2 px-3 font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum honorário encontrado.
                </td>
              </tr>
            )}
            {invoices.map((inv, i) => (
              <tr
                key={inv.id}
                style={{
                  background: i % 2 === 0 ? "transparent" : "oklch(0.155 0.02 264 / 0.5)",
                  borderBottom: "1px solid oklch(1 0 0 / 5%)",
                }}
              >
                <td className="py-2 px-3">{inv.description}</td>
                <td className="py-2 px-3">{inv.client.name}</td>
                <td className="py-2 px-3">{inv.case?.number ?? "-"}</td>
                <td className="py-2 px-3">{formatDate(inv.dueDate)}</td>
                <td className="py-2 px-3 font-medium">{formatCurrency(Number(inv.amount))}</td>
                <td className="py-2 px-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background:
                        inv.status === "PAGO"
                          ? "oklch(0.65 0.15 150 / 0.2)"
                          : inv.status === "ATRASADO"
                            ? "oklch(0.55 0.2 25 / 0.2)"
                            : "oklch(0.6 0.02 264 / 0.2)",
                      color:
                        inv.status === "PAGO"
                          ? "oklch(0.65 0.15 150)"
                          : inv.status === "ATRASADO"
                            ? "oklch(0.65 0.2 25)"
                            : "oklch(0.7 0.02 264)",
                    }}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid oklch(0.66 0.18 274 / 0.4)" }}>
              <td colSpan={4} className="py-3 px-3 font-medium">
                Total ({invoices.length} lançamentos)
              </td>
              <td className="py-3 px-3 font-bold">{formatCurrency(totalGeral)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-muted-foreground text-right">
          Gerado em {new Date().toLocaleDateString("pt-BR")} · Lexo
        </p>
      </div>
    </>
  );
}
