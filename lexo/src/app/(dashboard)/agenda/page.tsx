import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { DeadlineToggle } from "@/components/agenda/deadline-toggle";
import { deleteDeadline } from "@/actions/agenda";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export default async function AgendaPage() {
  const session = await requireSession();

  const deadlines = await db.deadline.findMany({
    where: { organizationId: session.user.organizationId },
    include: { case: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <Button nativeButton={false} render={<Link href="/agenda/novo" />}>
          Novo prazo
        </Button>
      </div>

      <div className="space-y-2">
        {deadlines.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum prazo cadastrado ainda.</p>
        )}
        {deadlines.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-md border p-4"
          >
            <div className="flex items-center gap-3">
              <DeadlineToggle deadlineId={d.id} completed={d.status === "CONCLUIDO"} />
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-sm text-muted-foreground">
                  {d.case.number} · {formatDate(d.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={d.type === "AUDIENCIA" ? "default" : "secondary"}>
                {d.type}
              </Badge>
              <DeleteButton action={deleteDeadline.bind(null, d.id)} label="Excluir" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
