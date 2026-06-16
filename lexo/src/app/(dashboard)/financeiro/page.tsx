import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { MarkPaidButton } from "@/components/financeiro/mark-paid-button";
import { deleteInvoice } from "@/actions/financeiro";
import { formatDate, formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PAGO: "default",
  PENDENTE: "secondary",
  ATRASADO: "destructive",
  CANCELADO: "secondary",
};

export default async function FinanceiroPage() {
  const session = await requireSession();

  const invoices = await db.invoice.findMany({
    where: { organizationId: session.user.organizationId },
    include: { client: true, case: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <Button nativeButton={false} render={<Link href="/financeiro/novo" />}>
          Novo honorário
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Processo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum honorário cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.description}</TableCell>
              <TableCell>{inv.client.name}</TableCell>
              <TableCell>{inv.case?.number ?? "-"}</TableCell>
              <TableCell>
                {formatCurrency(inv.amount)}
              </TableCell>
              <TableCell>{formatDate(inv.dueDate)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[inv.status] ?? "secondary"}>
                  {inv.status}
                </Badge>
              </TableCell>
              <TableCell className="flex items-center justify-end gap-2">
                {inv.status !== "PAGO" && <MarkPaidButton invoiceId={inv.id} />}
                <DeleteButton action={deleteInvoice.bind(null, inv.id)} label="Excluir" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
