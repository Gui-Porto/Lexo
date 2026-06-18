import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CaseFormWrapper } from "@/components/processos/case-form-wrapper";
import { createCase } from "@/actions/processos";

export default async function NovoProcessoPage() {
  const session = await requireSession();
  const [clients, users] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo processo</h1>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre um cliente antes de criar um processo.
        </p>
      ) : (
        <CaseFormWrapper action={createCase} clients={clients} users={users} submitLabel="Criar processo" />
      )}
    </div>
  );
}
