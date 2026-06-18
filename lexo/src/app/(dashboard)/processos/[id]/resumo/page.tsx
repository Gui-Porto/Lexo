import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ResumoGenerator } from "./resumo-generator";
import { SparklesIcon, ArrowLeftIcon } from "lucide-react";

export default async function ResumoProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const caso = await db.case.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, number: true },
  });

  if (!caso) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resumo do Processo"
        icon={SparklesIcon}
        action={
          <Button variant="outline" size="sm" render={<Link href={`/processos/${id}`} />}>
            <ArrowLeftIcon />
            Voltar ao processo
          </Button>
        }
      />

      <ResumoGenerator caseId={id} caseNumber={caso.number} />
    </div>
  );
}
