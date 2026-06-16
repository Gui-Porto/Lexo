import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { InvoiceForm } from "@/components/financeiro/invoice-form";

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
      <h1 className="text-2xl font-semibold">Novo honorário</h1>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre um cliente antes de criar um honorário.
        </p>
      ) : (
        <InvoiceForm clients={clients} cases={cases} />
      )}
    </div>
  );
}
