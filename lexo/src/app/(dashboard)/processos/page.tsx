import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProcessosPage() {
  const session = await requireSession();

  const cases = await db.case.findMany({
    where: { organizationId: session.user.organizationId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processos</h1>
        <Button nativeButton={false} render={<Link href="/processos/novo" />}>
          Novo processo
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nenhum processo cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
          {cases.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/processos/${c.id}`} className="font-medium hover:underline">
                  {c.number}
                </Link>
              </TableCell>
              <TableCell>{c.client.name}</TableCell>
              <TableCell>{c.area ?? "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{c.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
