import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CaseForm } from "@/components/processos/case-form";
import { DeleteButton } from "@/components/delete-button";
import { updateCase, deleteCase } from "@/actions/processos";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProcessoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [caseItem, clients] = await Promise.all([
    db.case.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { deadlines: true, invoices: true },
    }),
    db.client.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!caseItem) {
    notFound();
  }

  const boundUpdate = updateCase.bind(null, caseItem.id);
  const boundDelete = deleteCase.bind(null, caseItem.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{caseItem.number}</h1>
        <DeleteButton action={boundDelete} label="Excluir processo" />
      </div>

      <CaseForm
        action={boundUpdate}
        clients={clients}
        defaultValues={caseItem}
        submitLabel="Salvar alterações"
      />

      <Card>
        <CardHeader>
          <CardTitle>Prazos e audiências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {caseItem.deadlines.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum prazo cadastrado.</p>
          )}
          {caseItem.deadlines.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
              <span>{d.title}</span>
              <Badge variant="secondary">{d.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Honorários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {caseItem.invoices.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum honorário cadastrado.</p>
          )}
          {caseItem.invoices.map((inv) => (
            <Link
              key={inv.id}
              href="/financeiro"
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <span>{inv.description}</span>
              <Badge variant="secondary">{inv.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
