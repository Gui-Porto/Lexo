"use client";

import { useActionState, useTransition, useState } from "react";
import { createTask, updateTaskStatus, deleteTask } from "@/actions/tarefas";

const AC = "#cef79e";

const inputStyle = {
  background: "#1a2425",
  border: "1px solid #283738",
  borderRadius: 8,
  padding: "9px 12px",
  color: "white",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

type CaseOption = { id: string; number: string; area?: string | null };
type UserOption = { id: string; name: string };

// ─── Create form ──────────────────────────────────────────────────────────────

export function CreateTaskForm({
  cases,
  users,
}: {
  cases: CaseOption[];
  users: UserOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createTask, undefined);

  const today = new Date().toISOString().split("T")[0];

  const priorityOpts = [
    { value: "BAIXA", label: "Baixa" },
    { value: "MEDIA", label: "Média" },
    { value: "ALTA", label: "Alta" },
  ];

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: AC,
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ＋ Nova tarefa
        </button>
      ) : (
        <div
          style={{
            background: "#222f30",
            border: `1px solid ${AC}30`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Nova tarefa</p>
          <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                Título *
              </label>
              <input name="title" type="text" required placeholder="Ex: Protocolar recurso" style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "2 1 200px" }}>
                <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                  Processo
                </label>
                <select name="caseId" style={inputStyle}>
                  <option value="">— nenhum —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.number}{c.area ? ` · ${c.area}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "2 1 180px" }}>
                <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                  Responsável
                </label>
                <select name="assignedToId" style={inputStyle}>
                  <option value="">— nenhum —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                  Prioridade
                </label>
                <select name="priority" style={inputStyle}>
                  {priorityOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                  Prazo
                </label>
                <input name="dueDate" type="date" min={today} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#93a09f", display: "block", marginBottom: 4 }}>
                Descrição
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Detalhes opcionais…"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {state?.error && (
              <p style={{ fontSize: 13, color: "oklch(0.65 0.20 25)" }}>{state.error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                style={{
                  background: AC,
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 20px",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Criar tarefa
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "1px solid #4d5757", /* FIXME(theme): L=0.28 fora das faixas definidas, aproximado pelo tom neutro de borda */
                  borderRadius: 10,
                  padding: "9px 16px",
                  color: "#93a09f",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Status button ────────────────────────────────────────────────────────────

const STATUS_NEXT: Record<string, "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"> = {
  PENDENTE: "EM_ANDAMENTO",
  EM_ANDAMENTO: "CONCLUIDA",
  CONCLUIDA: "PENDENTE",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  PENDENTE:    { bg: "rgb(100 116 139 / 0.12)", color: "#94a3b8",    border: "rgb(100 116 139 / 0.25)" },
  EM_ANDAMENTO:{ bg: "rgb(8 145 178 / 0.12)",  color: "#22d3ee",    border: "rgb(8 145 178 / 0.25)" },
  CONCLUIDA:   { bg: "rgb(5 150 105 / 0.12)",  color: "#34d399",    border: "rgb(5 150 105 / 0.25)" },
};

const PRIORITY_COLOR: Record<string, string> = {
  BAIXA: "#64748b",
  MEDIA: "#f59e0b",
  ALTA:  "#ef4444",
};

const PRIORITY_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export function TaskCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    assignedToName: string | null;
    case: { number: string; area: string | null } | null;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const sc = STATUS_COLOR[task.status] ?? STATUS_COLOR.PENDENTE;
  const isOverdue =
    task.dueDate && task.status !== "CONCLUIDA" && new Date(task.dueDate) < new Date();

  function handleStatus() {
    startTransition(async () => {
      await updateTaskStatus(task.id, STATUS_NEXT[task.status] ?? "PENDENTE");
    });
  }

  function handleDelete() {
    if (!confirm("Remover esta tarefa?")) return;
    startTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 18px",
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Status toggle */}
      <button
        onClick={handleStatus}
        disabled={isPending}
        title={`Avançar para: ${STATUS_LABEL[STATUS_NEXT[task.status] ?? "PENDENTE"]}`}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: task.status === "CONCLUIDA" ? "rgb(5 150 105 / 0.25)" : "transparent",
          border: `2px solid ${task.status === "CONCLUIDA" ? "#34d399" : "#4d5757"}`, /* FIXME(theme): L=0.30 fora das faixas definidas, aproximado pelo tom neutro de borda */
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#34d399",
          marginTop: 1,
          transition: "all 0.15s",
        }}
      >
        {task.status === "CONCLUIDA" ? "✓" : ""}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: task.status === "CONCLUIDA" ? "#93a09f" : "white",
              textDecoration: task.status === "CONCLUIDA" ? "line-through" : "none",
              flex: 1,
            }}
          >
            {task.title}
          </p>
          {/* Badges */}
          <span
            style={{
              fontSize: 11,
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.border}`,
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              fontWeight: 500,
            }}
          >
            {STATUS_LABEL[task.status]}
          </span>
          <span
            style={{
              fontSize: 11,
              background: `${PRIORITY_COLOR[task.priority]}15`,
              color: PRIORITY_COLOR[task.priority],
              border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {task.description && (
          <p style={{ fontSize: 12, color: "#93a09f", marginTop: 4 }}>
            {task.description}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          {task.case && (
            <span style={{ fontSize: 12, color: AC, fontFamily: "monospace" }}>
              {task.case.number}
            </span>
          )}
          {task.assignedToName && (
            <span style={{ fontSize: 12, color: "#93a09f" }}>
              → {task.assignedToName}
            </span>
          )}
          {task.dueDate && (
            <span
              style={{
                fontSize: 12,
                color: isOverdue ? "#ef4444" : "#93a09f",
                fontWeight: isOverdue ? 600 : 400,
              }}
            >
              {isOverdue ? "⚠ " : ""}Prazo:{" "}
              {new Date(task.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Remover"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#93a09f",
          fontSize: 14,
          padding: "4px 6px",
          borderRadius: 6,
          alignSelf: "flex-start",
          marginTop: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}
