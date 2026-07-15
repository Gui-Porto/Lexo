import { notFound } from "next/navigation";
import { db } from "@/lib/db";

const AC = "#cef79e";

function fmtDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtCurrency(value: { toString(): string }): string {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ATIVO:     { label: "Ativo",     color: "#34d399", bg: "rgb(5 150 105 / 0.12)" },
  SUSPENSO:  { label: "Suspenso",  color: "#f59e0b", bg: "rgb(245 158 11 / 0.12)" },
  ARQUIVADO: { label: "Arquivado", color: "#94a3b8", bg: "rgb(100 116 139 / 0.12)" },
  ENCERRADO: { label: "Encerrado", color: "#64748b", bg: "rgb(100 116 139 / 0.10)" },
};

const DEADLINE_STATUS: Record<string, { label: string; color: string }> = {
  PENDENTE:  { label: "Pendente",  color: "#f59e0b" },
  CONCLUIDO: { label: "Concluído", color: "#34d399" },
  PERDIDO:   { label: "Perdido",   color: "#ef4444" },
};

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  PENDENTE:  { label: "Pendente",  color: "#f59e0b" },
  PAGO:      { label: "Pago",      color: "#34d399" },
  ATRASADO:  { label: "Atrasado",  color: "#ef4444" },
  CANCELADO: { label: "Cancelado", color: "#64748b" },
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await db.client.findUnique({
    where: { portalToken: token },
    include: {
      cases: {
        include: {
          deadlines: {
            where: { status: { not: "CONCLUIDO" } },
            orderBy: { date: "asc" },
            take: 5,
          },
          invoices: {
            where: { status: { not: "CANCELADO" } },
            orderBy: { dueDate: "desc" },
            take: 5,
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!client || !client.portalEnabled) notFound();

  const totalInvoicesPending = client.cases
    .flatMap((c) => c.invoices)
    .filter((inv) => inv.status === "PENDENTE" || inv.status === "ATRASADO")
    .reduce((s, inv) => s + Number(inv.amount), 0);

  const upcomingDeadlines = client.cases
    .flatMap((c) => c.deadlines.map((d) => ({ ...d, caseNumber: c.number })))
    .filter((d) => d.status === "PENDENTE")
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div
      className="dark"
      style={{
        minHeight: "100vh",
        background: "#222f30",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          borderBottom: "1px solid #4d5757",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${AC}20`,
              border: `1px solid ${AC}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⚖
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Portal do Cliente</p>
            <p style={{ fontSize: 12, color: "#93a09f" }}>Acesso seguro e somente leitura</p>
          </div>
        </div>
        <div
          style={{
            background: `${AC}12`,
            border: `1px solid ${AC}25`,
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            color: AC,
            fontWeight: 600,
          }}
        >
          {client.name}
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { label: "Processos",         value: client.cases.length },
            { label: "Ativos",            value: client.cases.filter((c) => c.status === "ATIVO").length },
            { label: "Prazos próximos",   value: upcomingDeadlines.length },
            { label: "Faturas em aberto", value: totalInvoicesPending > 0 ? fmtCurrency(totalInvoicesPending) : "R$ 0,00" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: "1 1 160px",
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontSize: 12, color: "#93a09f", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 14 }}>
              Próximos prazos
            </h2>
            <div
              style={{
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {upcomingDeadlines.map((d, i) => {
                const isUrgent = new Date(d.date) <= new Date(Date.now() + 3 * 86400000);
                return (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "14px 20px",
                      alignItems: "center",
                      borderBottom: i < upcomingDeadlines.length - 1 ? "1px solid #4d5757" : "none",
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isUrgent ? "rgb(239 68 68 / 0.12)" : "rgb(245 158 11 / 0.10)",
                        border: `1px solid ${isUrgent ? "rgb(239 68 68 / 0.25)" : "rgb(245 158 11 / 0.20)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      {isUrgent ? "⚠" : "📅"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "white" }}>{d.title}</p>
                      <p style={{ fontSize: 12, color: AC, fontFamily: "monospace", marginTop: 2 }}>{d.caseNumber}</p>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isUrgent ? "#ef4444" : "#f59e0b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(d.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cases */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 14 }}>
            Processos ({client.cases.length})
          </h2>
          {client.cases.length === 0 ? (
            <p style={{ color: "#93a09f", fontSize: 14 }}>Nenhum processo cadastrado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {client.cases.map((c) => {
                const sb = STATUS_BADGE[c.status] ?? STATUS_BADGE.ATIVO;
                const pendingInvoices = c.invoices.filter(
                  (inv) => inv.status === "PENDENTE" || inv.status === "ATRASADO"
                );
                return (
                  <div
                    key={c.id}
                    style={{
                      background: "#222f30",
                      border: "1px solid #4d5757",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    {/* Case header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "16px 20px",
                        borderBottom: (c.deadlines.length > 0 || c.invoices.length > 0) ? "1px solid #4d5757" : "none",
                        flexWrap: "wrap",
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: "white", fontFamily: "monospace", flex: 1 }}>
                        {c.number}
                      </p>
                      {c.area && (
                        <span style={{ fontSize: 12, background: "#283738", color: "#93a09f", borderRadius: 6, padding: "2px 8px" }}>
                          {c.area}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          background: sb.bg,
                          color: sb.color,
                          border: `1px solid ${sb.color}30`,
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontWeight: 600,
                        }}
                      >
                        {sb.label}
                      </span>
                    </div>

                    {/* Deadlines sub-list */}
                    {c.deadlines.map((d) => {
                      const ds = DEADLINE_STATUS[d.status] ?? DEADLINE_STATUS.PENDENTE;
                      return (
                        <div
                          key={d.id}
                          style={{
                            display: "flex",
                            gap: 12,
                            padding: "10px 20px",
                            borderBottom: "1px solid #4d5757",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#93a09f" }}>📅</span>
                          <span style={{ fontSize: 13, color: "white", flex: 1 }}>{d.title}</span>
                          <span style={{ fontSize: 12, color: ds.color, fontWeight: 500 }}>{ds.label}</span>
                          <span style={{ fontSize: 12, color: "#93a09f", whiteSpace: "nowrap" }}>{fmtDate(d.date)}</span>
                        </div>
                      );
                    })}

                    {/* Invoices sub-list */}
                    {c.invoices.map((inv) => {
                      const is = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.PENDENTE;
                      return (
                        <div
                          key={inv.id}
                          style={{
                            display: "flex",
                            gap: 12,
                            padding: "10px 20px",
                            borderBottom: "1px solid #4d5757",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#93a09f" }}>💳</span>
                          <span style={{ fontSize: 13, color: "white", flex: 1 }}>{inv.description}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{fmtCurrency(inv.amount)}</span>
                          <span style={{ fontSize: 12, color: is.color, fontWeight: 500 }}>{is.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{ textAlign: "center", paddingTop: 16, borderTop: "1px solid #4d5757" }}>
          <p style={{ fontSize: 12, color: "#93a09f" }}>
            Acesso seguro · Somente leitura · Lexo Tecnologia Jurídica
          </p>
        </footer>
      </main>
    </div>
  );
}
