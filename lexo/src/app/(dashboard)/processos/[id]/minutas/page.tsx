import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plan-permissions";
import { PlanGate } from "@/components/plan-gate";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MinutaGenerator } from "./minuta-generator";
import { FileTextIcon, ArrowLeftIcon } from "lucide-react";

export default async function MinutasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [org, caso] = await Promise.all([
    db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { plan: true },
    }),
    db.case.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { client: { select: { name: true } } },
    }),
  ]);

  if (!caso) notFound();

  const limits = getPlanLimits(org?.plan ?? "trial");

  if (!limits.canUseMinutas) {
    return (
      <PlanGate
        feature="Gerador de Minutas com IA"
        description="Gere minutas e peças processuais automaticamente usando IA, adaptadas ao contexto do seu processo. Disponível no plano Pro."
        requiredPlan="pro"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gerador de Minutas"
        icon={FileTextIcon}
        action={
          <Button variant="outline" size="sm" render={<Link href={`/processos/${id}`} />}>
            <ArrowLeftIcon />
            Voltar ao processo
          </Button>
        }
      />

      <MinutaGenerator
        caseId={id}
        caseNumber={caso.number}
        clientName={caso.client.name}
        area={caso.area}
        description={caso.description}
      />
    </div>
  );
}
