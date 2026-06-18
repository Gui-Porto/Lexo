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
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { SparklesIcon } from "lucide-react";
import { RiskBadge } from "@/components/agenda/risk-badge";

export default async function ProcessoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [caseItem, clients, users, activityLogs] = await Promise.all([
    db.case.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: { deadlines: true, invoices: true, responsavel: { select: { name: true } } },
    }),
    db.client.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.activityLog.findMany({
      where: { caseId: id, organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/processos/${id}/minutas`} />}>
            <SparklesIcon />
            Gerar minuta
          </Button>
          <DeleteButton action={boundDelete} label="Excluir processo" />
        </div>
      </div>

      <CaseForm
        action={boundUpdate}
        clients={clients}
        users={users}
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
              <div className="flex items-center gap-2">
                <RiskBadge date={d.date} type={d.type} status={d.status} />
                <Badge variant="secondary">{d.status}</Badge>
              </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Histórico de atividades</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          )}
          <ol className="space-y-3">
            {activityLogs.map((log) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                <div>
                  <p>{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.userName} · {formatDate(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
