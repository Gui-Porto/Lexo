import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { ClientForm } from "@/components/clientes/client-form";
import { DeleteButton } from "@/components/delete-button";
import { updateClient, deleteClient } from "@/actions/clientes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const client = await db.client.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { cases: true },
  });

  if (!client) {
    notFound();
  }

  const boundUpdate = updateClient.bind(null, client.id);
  const boundDelete = deleteClient.bind(null, client.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <DeleteButton action={boundDelete} label="Excluir cliente" />
      </div>

      <ClientForm
        action={boundUpdate}
        defaultValues={client}
        submitLabel="Salvar alterações"
      />

      <Card>
        <CardHeader>
          <CardTitle>Processos vinculados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {client.cases.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum processo vinculado a este cliente.
            </p>
          )}
          {client.cases.map((c) => (
            <Link
              key={c.id}
              href={`/processos/${c.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <span className="font-medium">{c.number}</span>
              <Badge variant="secondary">{c.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
