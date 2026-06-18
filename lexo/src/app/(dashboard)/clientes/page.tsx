import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  const where = {
    organizationId: orgId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { document: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.client.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        icon={Users}
        action={
          <Button nativeButton={false} render={<Link href="/clientes/novo" />}>
            Novo cliente
          </Button>
        }
      />

      <Suspense>
        <SearchFilters />
      </Suspense>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link href={`/clientes/${client.id}`} className="font-medium hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{client.document ?? "-"}</TableCell>
              <TableCell>{client.email ?? "-"}</TableCell>
              <TableCell>{client.phone ?? "-"}</TableCell>
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
