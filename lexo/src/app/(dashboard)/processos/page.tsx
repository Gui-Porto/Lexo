import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";
import { PageHeader } from "@/components/page-header";
import { Briefcase } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewToggle } from "./view-toggle";
import { KanbanBoard, type KanbanCase } from "./kanban-board";
import { TimelineView, type TimelineCase } from "./timeline-view";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "ARQUIVADO", label: "Arquivado" },
  { value: "ENCERRADO", label: "Encerrado" },
];

type View = "table" | "kanban" | "timeline";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; view?: string }>;
}) {
  const session = await requireSession();
  const { q, status, page: pageStr, view: viewParam } = await searchParams;
  const view: View = (viewParam === "kanban" || viewParam === "timeline") ? viewParam : "table";
  const page = Math.max(1, Number(pageStr ?? 1));
  const orgId = session.user.organizationId;
  const isAdvogado = session.user.role === "ADVOGADO";

  const where = {
    organizationId: orgId,
    ...(status ? { status: status as "ATIVO" | "SUSPENSO" | "ARQUIVADO" | "ENCERRADO" } : {}),
    AND: [
      ...(isAdvogado
        ? [{ OR: [{ responsavelId: session.user.id }, { responsavelId: null }] }]
        : []),
      ...(q
        ? [
            {
              OR: [
                { number: { contains: q, mode: "insensitive" as const } },
                { area: { contains: q, mode: "insensitive" as const } },
                { client: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            },
          ]
        : []),
    ],
  };

  // Kanban e Timeline buscam todos sem paginação
  const isAlt = view === "kanban" || view === "timeline";

  const baseQuery = {
    where,
    include: { client: true, responsavel: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  } as const;

  const [cases, total] = isAlt
    ? await Promise.all([db.case.findMany({ ...baseQuery, take: 500 }), Promise.resolve(0)])
    : await Promise.all([
        db.case.findMany({ ...baseQuery, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        db.case.count({ where }),
      ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processos"
        icon={Briefcase}
        action={
          <div className="flex items-center gap-3">
            <Suspense>
              <ViewToggle current={view} />
            </Suspense>
            <Button nativeButton={false} render={<Link href="/processos/novo" />}>
              Novo processo
            </Button>
          </div>
        }
      />

      <Suspense>
        <SearchFilters statusOptions={STATUS_OPTIONS} />
      </Suspense>

      {view === "table" && (
        <>
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
                    Nenhum processo encontrado.
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

          <Suspense>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
          </Suspense>
        </>
      )}

      {view === "kanban" && (
        <KanbanBoard
          initialCases={
            cases.map((c) => ({
              id: c.id,
              number: c.number,
              area: c.area,
              status: c.status,
              client: { name: c.client.name },
              responsavel: c.responsavel ?? null,
            })) satisfies KanbanCase[]
          }
        />
      )}

      {view === "timeline" && (
        <TimelineView
          cases={
            cases.map((c) => ({
              id: c.id,
              number: c.number,
              area: c.area,
              status: c.status,
              createdAt: c.createdAt,
              client: { name: c.client.name },
            })) satisfies TimelineCase[]
          }
        />
      )}
    </div>
  );
}
