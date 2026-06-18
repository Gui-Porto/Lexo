import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { DeadlineToggle } from "@/components/agenda/deadline-toggle";
import { RiskBadge } from "@/components/agenda/risk-badge";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { deleteDeadline } from "@/actions/agenda";
import { formatDate } from "@/lib/format";
import { CalendarClock } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "PERDIDO", label: "Perdido" },
];

const TYPE_OPTIONS = [
  { value: "PRAZO", label: "Prazo" },
  { value: "AUDIENCIA", label: "Audiência" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "OUTRO", label: "Outro" },
];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}) {
  const session = await requireSession();
  const { q, status, type, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;

  // Expirar automaticamente prazos pendentes já vencidos
  await db.deadline.updateMany({
    where: { organizationId: orgId, status: "PENDENTE", date: { lt: new Date() } },
    data: { status: "PERDIDO" },
  });

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "PENDENTE" | "CONCLUIDO" | "PERDIDO" } : {}),
    ...(type ? { type: type as "PRAZO" | "AUDIENCIA" | "REUNIAO" | "OUTRO" } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { case: { number: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [deadlines, total] = await Promise.all([
    db.deadline.findMany({
      where,
      include: { case: true },
      orderBy: { date: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.deadline.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        icon={CalendarClock}
        action={
          <Button nativeButton={false} render={<Link href="/agenda/novo" />}>
            Novo prazo
          </Button>
        }
      />

      <Suspense>
        <div className="flex flex-wrap gap-2">
          <SearchFilters statusOptions={STATUS_OPTIONS} />
          <SearchFilters statusOptions={TYPE_OPTIONS} statusParam="type" />
        </div>
      </Suspense>

      <div className="space-y-2">
        {deadlines.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum prazo encontrado.</p>
        )}
        {deadlines.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-xl p-4 transition-all duration-150 hover:bg-white/[0.03]"
            style={{
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 7%)",
            }}
          >
            <div className="flex items-center gap-3">
              <DeadlineToggle deadlineId={d.id} completed={d.status === "CONCLUIDO"} />
              <div>
                <p className={`font-medium ${d.status === "PERDIDO" ? "line-through text-muted-foreground" : ""}`}>
                  {d.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {d.case.number} · {formatDate(d.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RiskBadge date={d.date} type={d.type} status={d.status} />
              {d.status === "PERDIDO" && (
                <Badge variant="destructive">Perdido</Badge>
              )}
              {d.status === "CONCLUIDO" && (
                <Badge variant="secondary">Concluído</Badge>
              )}
              <Badge variant={d.type === "AUDIENCIA" ? "default" : "secondary"}>
                {d.type}
              </Badge>
              <Link
                href={`/agenda/${d.id}`}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Editar
              </Link>
              <DeleteButton action={deleteDeadline.bind(null, d.id)} label="Excluir" />
            </div>
          </div>
        ))}
      </div>

      <Suspense>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
