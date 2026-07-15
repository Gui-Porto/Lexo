import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CreateTaskForm, TaskCard } from "./task-client";

const AC = "#cef79e";
const AC2 = "#cef79e";

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluídas" },
] as const;

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  const { status } = await searchParams;
  const orgId = session.user.organizationId;

  const validStatuses = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];
  const statusFilter = status && validStatuses.includes(status)
    ? (status as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA")
    : undefined;

  const [tasks, cases, users] = await Promise.all([
    db.task.findMany({
      where: {
        organizationId: orgId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { case: { select: { number: true, area: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    db.case.findMany({
      where: { organizationId: orgId, status: "ATIVO" },
      select: { id: true, number: true, area: true },
      orderBy: { number: "asc" },
    }),
    db.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const counts = {
    total: await db.task.count({ where: { organizationId: orgId } }),
    PENDENTE: await db.task.count({ where: { organizationId: orgId, status: "PENDENTE" } }),
    EM_ANDAMENTO: await db.task.count({ where: { organizationId: orgId, status: "EM_ANDAMENTO" } }),
    CONCLUIDA: await db.task.count({ where: { organizationId: orgId, status: "CONCLUIDA" } }),
  };

  const overdueCount = tasks.filter(
    (t) => t.dueDate && t.status !== "CONCLUIDA" && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Tarefas
          </h1>
        <p style={{ fontSize: 14, color: "#93a09f", marginTop: 4 }}>
          Gerencie as tarefas do escritório e acompanhe o progresso da equipe.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { label: "Pendentes",    value: counts.PENDENTE,    color: "#94a3b8" },
          { label: "Em andamento", value: counts.EM_ANDAMENTO, color: "#22d3ee" },
          { label: "Concluídas",   value: counts.CONCLUIDA,   color: "#34d399" },
          { label: "Atrasadas",    value: overdueCount,        color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              flex: "1 1 120px",
              background: "#222f30",
              border: "1px solid #283738",
              borderRadius: 14,
              padding: "14px 18px",
            }}
          >
            <p style={{ fontSize: 12, color: "#93a09f", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, background: "#222f30", borderRadius: 10, padding: 4, border: "1px solid #283738" }}>
          {STATUS_TABS.map((tab) => {
            const active = (tab.value === "" && !statusFilter) || tab.value === statusFilter;
            const count = tab.value === "" ? counts.total : counts[tab.value as keyof typeof counts];
            return (
              <a
                key={tab.value}
                href={tab.value ? `/tarefas?status=${tab.value}` : "/tarefas"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  background: active ? `${AC}15` : "transparent",
                  color: active ? AC : "#93a09f",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
                <span style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
              </a>
            );
          })}
        </div>

        {/* Create form */}
        <Suspense fallback={null}>
          <CreateTaskForm cases={cases} users={users} />
        </Suspense>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px",
            gap: 16,
            background: "#1a2425",
            border: "1px dashed #283738", /* FIXME(theme): L=0.25 fora das faixas definidas, aproximado pelo tom mais claro do fundo */
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `${AC}12`,
              border: `1px solid ${AC}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ✓
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>
              {statusFilter ? "Nenhuma tarefa neste status" : "Nenhuma tarefa cadastrada"}
            </p>
            <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
              Crie uma tarefa usando o botão acima.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#222f30",
            border: "1px solid #283738",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {tasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                borderBottom: i < tasks.length - 1 ? "1px solid #222f30" : "none",
              }}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
