import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeadlineForm } from "@/components/agenda/deadline-form";
import { DeleteButton } from "@/components/delete-button";
import { updateDeadline, deleteDeadline } from "@/actions/agenda";
import { PageHeader } from "@/components/page-header";
import { CalendarClock } from "lucide-react";

export default async function EditDeadlinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [deadline, cases] = await Promise.all([
    db.deadline.findFirst({
      where: { id, organizationId: session.user.organizationId },
    }),
    db.case.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, number: true },
      orderBy: { number: "asc" },
    }),
  ]);

  if (!deadline) notFound();

  const boundUpdate = updateDeadline.bind(null, deadline.id);
  const boundDelete = deleteDeadline.bind(null, deadline.id);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        title="Editar prazo"
        action={<DeleteButton action={boundDelete} label="Excluir prazo" />}
      />

      <DeadlineForm
        action={boundUpdate}
        cases={cases}
        defaultValues={{
          caseId: deadline.caseId,
          title: deadline.title,
          type: deadline.type,
          date: deadline.date.toISOString().split("T")[0],
          description: deadline.description,
        }}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
