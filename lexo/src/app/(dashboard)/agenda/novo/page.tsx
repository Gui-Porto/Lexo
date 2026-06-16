import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { DeadlineForm } from "@/components/agenda/deadline-form";

export default async function NovoPrazoPage() {
  const session = await requireSession();
  const cases = await db.case.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, number: true },
    orderBy: { number: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo prazo</h1>
      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre um processo antes de criar um prazo.
        </p>
      ) : (
        <DeadlineForm cases={cases} />
      )}
    </div>
  );
}
