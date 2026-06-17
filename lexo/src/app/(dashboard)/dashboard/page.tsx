import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { formatDate, formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);

  const [
    processosAtivos,
    prazos7dias,
    faturasSoma,
    totalClientes,
    proximosPrazos,
    processosRecentes,
  ] = await Promise.all([
    db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
    db.deadline.count({
      where: {
        organizationId: orgId,
        status: "PENDENTE",
        date: { gte: now, lte: in7days },
      },
    }),
    db.invoice.aggregate({
      where: {
        organizationId: orgId,
        status: { in: ["PENDENTE", "ATRASADO"] },
      },
      _sum: { amount: true },
    }),
    db.client.count({ where: { organizationId: orgId } }),
    db.deadline.findMany({
      where: {
        organizationId: orgId,
        status: "PENDENTE",
        date: { gte: now },
      },
      include: { case: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.case.findMany({
      where: { organizationId: orgId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalAberto = faturasSoma._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Processos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{processosAtivos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Prazos em 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${prazos7dias > 0 ? "text-amber-400" : ""}`}>
              {prazos7dias}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Faturas em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(Number(totalAberto))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalClientes}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos prazos</CardTitle>
          </CardHeader>
          <CardContent>
            {proximosPrazos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prazo pendente.</p>
            ) : (
              <ul className="space-y-3">
                {proximosPrazos.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.case.number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{d.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(d.date)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/agenda" className="mt-4 block text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum processo cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {processosRecentes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/processos/${c.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {c.number}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.client.name}</p>
                    </div>
                    <Badge variant="secondary">{c.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/processos" className="mt-4 block text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
