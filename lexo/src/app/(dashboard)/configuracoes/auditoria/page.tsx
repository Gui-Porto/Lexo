import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck } from "lucide-react";

const PAGE_SIZE = 50;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where: { organizationId: session.user.organizationId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Auditoria" />

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma ação registrada ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="text-sm font-medium">{log.userName}</TableCell>
                <TableCell>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-mono"
                    style={{
                      background: "oklch(0.66 0.18 274 / 0.1)",
                      color: "oklch(0.75 0.12 274)",
                      border: "1px solid oklch(0.66 0.18 274 / 0.2)",
                    }}
                  >
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {total} registros
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}`} className="underline underline-offset-2">
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}`} className="underline underline-offset-2">
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
