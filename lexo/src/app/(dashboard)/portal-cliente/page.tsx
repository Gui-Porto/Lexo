import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { PortalToggle } from "./portal-client";

const AC = "#cef79e";
const AC2 = "#cef79e";

export default async function PortalClientePage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const clients = await db.client.findMany({
    where: { organizationId: orgId },
    include: {
      cases: {
        where: { status: "ATIVO" },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const enabledCount = clients.filter((c) => c.portalEnabled).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Portal Cliente
          </h1>
        <p style={{ fontSize: 14, color: "#93a09f", marginTop: 4 }}>
          Compartilhe um link seguro com seus clientes para que acompanhem os processos em tempo real.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { label: "Total de clientes", value: clients.length },
          { label: "Com portal ativo",  value: enabledCount },
          { label: "Sem acesso",        value: clients.length - enabledCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: "1 1 150px",
              background: "#222f30",
              border: "1px solid #4d5757",
              borderRadius: 14,
              padding: "14px 18px",
            }}
          >
            <p style={{ fontSize: 12, color: "#93a09f", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div
        style={{
          background: `${AC}08`,
          border: `1px solid ${AC}20`,
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ</span>
        <p style={{ fontSize: 13, color: "#93a09f", lineHeight: 1.5 }}>
          Ao ativar o portal de um cliente, é gerado um link único e seguro. Compartilhe diretamente com o cliente — ele verá os processos ativos, prazos e faturas sem precisar de conta.
        </p>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px",
            gap: 16,
            background: "#1a2425",
            border: "1px dashed #4d5757",
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
            👤
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Nenhum cliente cadastrado</p>
            <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
              Cadastre clientes em <a href="/clientes" style={{ color: AC }}>Clientes</a> para ativar o portal.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="r-tablewrap"
          style={{
            background: "#222f30",
            border: "1px solid #4d5757",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            className="r-tablegrid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: 16,
              padding: "10px 20px",
              borderBottom: "1px solid #4d5757",
              fontSize: 11,
              fontWeight: 600,
              color: "#93a09f",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <span>Cliente</span>
            <span>Processos ativos</span>
            <span>E-mail</span>
            <span>Portal</span>
          </div>

          {clients.map((client, i) => (
            <div
              key={client.id}
              className="r-tablegrid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: 16,
                padding: "16px 20px",
                alignItems: "center",
                borderBottom: i < clients.length - 1 ? "1px solid #4d5757" : "none",
              }}
            >
              {/* Name */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "white" }}>{client.name}</p>
                {client.document && (
                  <p style={{ fontSize: 12, color: "#93a09f", marginTop: 2, fontFamily: "monospace" }}>
                    {client.document}
                  </p>
                )}
              </div>

              {/* Case count */}
              <span
                style={{
                  fontSize: 13,
                  color: client.cases.length > 0 ? AC : "#93a09f",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {client.cases.length}
              </span>

              {/* Email */}
              <span style={{ fontSize: 13, color: "#93a09f" }}>
                {client.email ?? "—"}
              </span>

              {/* Portal toggle */}
              <PortalToggle
                clientId={client.id}
                enabled={client.portalEnabled}
                token={client.portalToken}
                baseUrl={baseUrl}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
