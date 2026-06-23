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
        <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "oklch(0.97 0.008 264)",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Jurimetria &amp; Previsões
          </h1>
        <p style={{ fontSize: 14, color: "oklch(0.55 0.02 264)", marginTop: 4 }}>
          Estimativas a partir de casos semelhantes, vara, juiz e assunto
        </p>
      </div>

      <JurimtriaAnalyzer processos={processos} />
    </div>
  );
}
