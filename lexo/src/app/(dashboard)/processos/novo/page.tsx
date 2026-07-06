import { Gavel } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CaseFormWrapper } from "@/components/processos/case-form-wrapper";
import { EmptyFormState } from "@/components/ui/form-section";
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
      <PageHeader icon={Gavel} title="Novo processo" />
      {clients.length === 0 ? (
        <EmptyFormState
          message="Cadastre um cliente antes de criar um processo."
          actionHref="/clientes/novo"
          actionLabel="Cadastrar cliente"
        />
      ) : (
        <CaseFormWrapper action={createCase} clients={clients} users={users} submitLabel="Criar processo" />
      )}
    </div>
  );
}
