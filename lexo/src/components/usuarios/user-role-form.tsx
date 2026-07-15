"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { updateUserRole } from "@/actions/usuarios";

const ROLE_OPTIONS = [
  { value: "ADVOGADO",   label: "Advogado"  },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "ADMIN",      label: "Admin"      },
];

const ROLE_COLORS: Record<string, { color: string; dot: string }> = {
  ADMIN:      { color: "#cef79e", dot: "#cef79e" },
  ADVOGADO:   { color: "oklch(0.72 0.15 150)", dot: "oklch(0.72 0.15 150)" },
  SECRETARIA: { color: "oklch(0.75 0.16 80)",  dot: "oklch(0.75 0.16 80)"  },
};

export function UserRoleForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [, formAction, pending] = useActionState(updateUserRole, undefined);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(currentRole);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectRole(value: string) {
    setRole(value);
    setOpen(false);
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  const selected = ROLE_OPTIONS.find((o) => o.value === role) ?? ROLE_OPTIONS[0];
  const rc = ROLE_COLORS[role] ?? ROLE_COLORS.ADVOGADO;

  return (
    <form ref={formRef} action={formAction} style={{ position: "relative" }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />

      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          height: 30, padding: "0 10px 0 8px",
          border: "1px solid #4d5757",
          borderRadius: 8,
          background: "#222f30",
          color: rc.color,
          fontSize: 12, fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.5 : 1,
          outline: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: rc.dot, flexShrink: 0 }} />
        {selected.label}
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, marginLeft: 1 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={containerRef}
          style={{
            position: "absolute", top: "calc(100% + 5px)", right: 0, zIndex: 50,
            minWidth: 130,
            background: "#222f30",
            border: "1px solid #4d5757",
            borderRadius: 10,
            boxShadow: "0 8px 24px oklch(0 0 0 / 0.4)",
            padding: "4px",
            display: "flex", flexDirection: "column", gap: 1,
          }}
        >
          {ROLE_OPTIONS.map((o) => {
            const c = ROLE_COLORS[o.value] ?? ROLE_COLORS.ADVOGADO;
            const isActive = o.value === role;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => selectRole(o.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 7,
                  border: "none",
                  background: isActive ? "#283738" : "transparent",
                  color: c.color,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  cursor: "pointer", textAlign: "left", width: "100%",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                {o.label}
                {isActive && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
}
