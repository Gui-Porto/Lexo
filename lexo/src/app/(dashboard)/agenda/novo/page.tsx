import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeadlineForm } from "@/components/agenda/deadline-form";
import { createDeadline } from "@/actions/agenda";
import { PageHeader } from "@/components/page-header";
import { EmptyFormState } from "@/components/ui/form-section";
import { CalendarClock } from "lucide-react";

export default async function NovoPrazoPage() {
  const session = await requireSession();
  const cases = await db.case.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, number: true },
    orderBy: { number: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarClock} title="Novo prazo" />
      {cases.length === 0 ? (
        <EmptyFormState
          message="Cadastre um processo antes de criar um prazo."
          actionHref="/processos/novo"
          actionLabel="Cadastrar processo"
        />
      ) : (
        <DeadlineForm action={createDeadline} cases={cases} />
      )}
    </div>
  );
}
