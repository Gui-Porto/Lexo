import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
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

  const caso = await db.case.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { client: { select: { name: true } } },
  });

  if (!caso) {
    notFound();
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
