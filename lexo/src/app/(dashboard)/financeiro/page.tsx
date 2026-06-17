import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { MarkPaidButton } from "@/components/financeiro/mark-paid-button";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { deleteInvoice } from "@/actions/financeiro";
import { formatDate, formatCurrency } from "@/lib/format";
import { Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "ATRASADO", label: "Atrasado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PAGO: "default",
  PENDENTE: "secondary",
  ATRASADO: "destructive",
  CANCELADO: "secondary",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, status, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO" } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { client: true, case: true },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.invoice.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        icon={Wallet}
        action={
          <Button nativeButton={false} render={<Link href="/financeiro/novo" />}>
            Novo honorário
          </Button>
        }
      />

      <Suspense>
        <SearchFilters statusOptions={STATUS_OPTIONS} />
      </Suspense>

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
                Nenhum honorário encontrado.
              </TableCell>
            </TableRow>
          )}
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.description}</TableCell>
              <TableCell>{inv.client.name}</TableCell>
              <TableCell>{inv.case?.number ?? "-"}</TableCell>
              <TableCell>{formatCurrency(Number(inv.amount))}</TableCell>
              <TableCell>{formatDate(inv.dueDate)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[inv.status] ?? "secondary"}>
                  {inv.status}
                </Badge>
              </TableCell>
              <TableCell className="flex items-center justify-end gap-2">
                {inv.status !== "PAGO" && <MarkPaidButton invoiceId={inv.id} />}
                <Link
                  href={`/financeiro/${inv.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteInvoice.bind(null, inv.id)} label="Excluir" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Suspense>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
