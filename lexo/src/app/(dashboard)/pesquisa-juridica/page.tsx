import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getPlanLimits } from "@/lib/plan-permissions";
import { PlanGate } from "@/components/plan-gate";
import { LexoAIChat } from "./lexo-ai-chat";

export default async function LexoIAPage() {
  const session = await requireSession();

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { plan: true },
  });

  const limits = getPlanLimits(org?.plan ?? "trial");

  if (!limits.canUseAI) {
    return (
      <PlanGate
        feature="Lexo IA — Pesquisa Jurídica"
        description="Faça perguntas jurídicas complexas, pesquise jurisprudência e obtenha análises em segundos com inteligência artificial. Disponível no plano Pro."
        requiredPlan="pro"
      />
    );
  }

  return (
    <div style={{ margin: "-26px -28px", height: "calc(100% + 52px)" }}>
      <LexoAIChat userEmail={session?.user?.email ?? undefined} />
    </div>
  );
}
