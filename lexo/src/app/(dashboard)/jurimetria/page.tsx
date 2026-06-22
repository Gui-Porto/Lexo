import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { JurimtriaAnalyzer } from "./jurimetria-analyzer";

export default async function JurimetriaPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const processos = await db.case.findMany({
    where: { organizationId: orgId },
    select: { id: true, number: true, area: true, client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.72 0.14 300))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Jurimetria
          </h1>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "oklch(0.66 0.18 274 / 0.15)",
              color: "oklch(0.72 0.18 274)",
              border: "1px solid oklch(0.66 0.18 274 / 0.30)",
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            NOVO
          </span>
        </div>
        <p style={{ fontSize: 14, color: "oklch(0.55 0.02 264)" }}>
          Analise probabilidade de êxito, duração e valor estimado com base em casos semelhantes.
        </p>
      </div>

      <JurimtriaAnalyzer processos={processos} />
    </div>
  );
}
