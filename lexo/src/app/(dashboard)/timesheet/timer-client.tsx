"use client";

import { useEffect, useState, useTransition } from "react";
import { stopTimer } from "@/actions/timesheet";

const AC = "oklch(0.66 0.18 274)";

function elapsedLabel(startedAt: Date): string {
  const secs = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function LiveTimer({
  entryId,
  startedAt,
  caseNumber,
  description,
}: {
  entryId: string;
  startedAt: Date;
  caseNumber?: string | null;
  description?: string | null;
}) {
  const [elapsed, setElapsed] = useState(() => elapsedLabel(startedAt));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setElapsed(elapsedLabel(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  function handleStop() {
    startTransition(async () => {
      await stopTimer(entryId);
    });
  }

  return (
    <div
      style={{
        background: `${AC}08`,
        border: `1px solid ${AC}30`,
        borderRadius: 16,
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      {/* Pulse dot */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 0 0 rgba(34,197,94,0.4)",
            animation: "pulse-ring 1.5s ease-out infinite",
          }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", marginBottom: 2 }}>
          TIMER ATIVO
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>
          {description || (caseNumber ? `Processo ${caseNumber}` : "Sem descrição")}
        </p>
        {caseNumber && description && (
          <p style={{ fontSize: 12, color: AC, marginTop: 2, fontFamily: "monospace" }}>
            {caseNumber}
          </p>
        )}
      </div>

      {/* Elapsed */}
      <div
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: 32,
          fontWeight: 700,
          color: "white",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        {elapsed}
      </div>

      {/* Stop button */}
      <button
        onClick={handleStop}
        disabled={isPending}
        style={{
          flexShrink: 0,
          background: "oklch(0.40 0.18 25)",
          border: "1px solid oklch(0.50 0.22 25)",
          borderRadius: 10,
          padding: "10px 20px",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isPending ? "Parando…" : "⏹ Parar"}
      </button>
    </div>
  );
}

// ─── Start timer form ─────────────────────────────────────────────────────────

import { startTimer, addManualEntry } from "@/actions/timesheet";
import { useActionState } from "react";

type CaseOption = { id: string; number: string; area?: string | null };

export function TimesheetForms({ cases }: { cases: CaseOption[] }) {
  const [tab, setTab] = useState<"timer" | "manual">("timer");
  const [startState, startAction] = useActionState(startTimer, undefined);
  const [manualState, manualAction] = useActionState(addManualEntry, undefined);

  const today = new Date().toISOString().split("T")[0];

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: active ? `${AC}15` : "transparent",
    color: active ? AC : "oklch(0.50 0.02 264)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const inputStyle = {
    background: "oklch(0.10 0.015 264)",
    border: "1px solid oklch(0.22 0.018 264)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "white",
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        background: "oklch(0.115 0.018 264)",
        border: "1px solid oklch(0.22 0.018 264)",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4 }}>
        <button style={tabStyle(tab === "timer")} onClick={() => setTab("timer")}>
          ▶ Iniciar timer
        </button>
        <button style={tabStyle(tab === "manual")} onClick={() => setTab("manual")}>
          ＋ Manual
        </button>
      </div>

      {tab === "timer" && (
        <form action={startAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 200px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Processo (opcional)
              </label>
              <select name="caseId" style={inputStyle}>
                <option value="">— sem processo —</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number}{c.area ? ` · ${c.area}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "3 1 280px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Descrição (opcional)
              </label>
              <input name="description" type="text" placeholder="Ex: Elaborar petição inicial" style={inputStyle} />
            </div>
          </div>
          {startState?.error && (
            <p style={{ fontSize: 13, color: "oklch(0.65 0.20 25)" }}>{startState.error}</p>
          )}
          <div>
            <button
              type="submit"
              style={{
                background: AC,
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ▶ Iniciar timer
            </button>
          </div>
        </form>
      )}

      {tab === "manual" && (
        <form action={manualAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 160px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Data
              </label>
              <input name="date" type="date" defaultValue={today} style={inputStyle} />
            </div>
            <div style={{ flex: "1 1 80px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Horas
              </label>
              <input name="hours" type="number" min="0" max="23" defaultValue="0" style={inputStyle} />
            </div>
            <div style={{ flex: "1 1 80px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Minutos
              </label>
              <input name="minutes" type="number" min="0" max="59" defaultValue="30" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 200px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Processo (opcional)
              </label>
              <select name="caseId" style={inputStyle}>
                <option value="">— sem processo —</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number}{c.area ? ` · ${c.area}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "3 1 280px" }}>
              <label style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", display: "block", marginBottom: 4 }}>
                Descrição (opcional)
              </label>
              <input name="description" type="text" placeholder="Ex: Reunião com cliente" style={inputStyle} />
            </div>
          </div>
          {manualState?.error && (
            <p style={{ fontSize: 13, color: "oklch(0.65 0.20 25)" }}>{manualState.error}</p>
          )}
          <div>
            <button
              type="submit"
              style={{
                background: "oklch(0.30 0.018 264)",
                border: "1px solid oklch(0.38 0.018 264)",
                borderRadius: 10,
                padding: "10px 24px",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ＋ Registrar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Delete button ────────────────────────────────────────────────────────────

import { deleteEntry } from "@/actions/timesheet";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await deleteEntry(entryId);
        })
      }
      disabled={isPending}
      title="Remover"
      style={{
        background: "none",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        color: "oklch(0.40 0.02 264)",
        fontSize: 14,
        padding: "4px 8px",
        borderRadius: 6,
        opacity: isPending ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      ✕
    </button>
  );
}
