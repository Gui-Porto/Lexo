import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CaseForm } from "@/components/processos/case-form";
import { createCase } from "@/actions/processos";

export default async function NovoProcessoPage() {
  const session = await requireSession();
  const clients = await db.client.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo processo</h1>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre um cliente antes de criar um processo.
        </p>
      ) : (
        <CaseForm action={createCase} clients={clients} submitLabel="Criar processo" />
      )}
    </div>
  );
}
