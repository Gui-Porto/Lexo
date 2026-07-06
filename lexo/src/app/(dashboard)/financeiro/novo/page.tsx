import { Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { InvoiceForm } from "@/components/financeiro/invoice-form";
import { EmptyFormState } from "@/components/ui/form-section";
import { PageHeader } from "@/components/page-header";
import { createInvoice } from "@/actions/financeiro";

export default async function NovoHonorarioPage() {
  const session = await requireSession();

  const [clients, cases] = await Promise.all([
    db.client.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.case.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, number: true },
      orderBy: { number: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Novo honorário" />
      {clients.length === 0 ? (
        <EmptyFormState
          message="Cadastre um cliente antes de criar um honorário."
          actionHref="/clientes/novo"
          actionLabel="Cadastrar cliente"
        />
      ) : (
        <InvoiceForm action={createInvoice} clients={clients} cases={cases} />
      )}
    </div>
  );
}
