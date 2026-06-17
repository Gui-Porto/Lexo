import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { InvoiceForm } from "@/components/financeiro/invoice-form";
import { DeleteButton } from "@/components/delete-button";
import { updateInvoice, deleteInvoice } from "@/actions/financeiro";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [invoice, clients, cases] = await Promise.all([
    db.invoice.findFirst({
      where: { id, organizationId: session.user.organizationId },
    }),
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

  if (!invoice) notFound();

  const boundUpdate = updateInvoice.bind(null, invoice.id);
  const boundDelete = deleteInvoice.bind(null, invoice.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar honorário</h1>
        <DeleteButton action={boundDelete} label="Excluir honorário" />
      </div>

      <InvoiceForm
        action={boundUpdate}
        clients={clients}
        cases={cases}
        defaultValues={{
          clientId: invoice.clientId,
          caseId: invoice.caseId,
          description: invoice.description,
          amount: Number(invoice.amount),
          status: invoice.status,
          dueDate: invoice.dueDate.toISOString().split("T")[0],
        }}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
