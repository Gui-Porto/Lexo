"use client";

import { useActionState } from "react";
import { completeGoogleSignup } from "@/actions/auth";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";

export function CompleteSignupForm({ email, name }: { email: string; name: string }) {
  const [state, formAction, pending] = useActionState(completeGoogleSignup, undefined);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "oklch(0.115 0.018 264)", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <p style={{ font: `400 13px ${F}`, color: "oklch(0.56 0.02 264)", margin: "0 0 6px" }}>
          Continuando como <strong style={{ color: "oklch(0.9 0.01 264)" }}>{name}</strong> ({email})
        </p>
        <h2 style={{ font: `700 24px ${F}`, letterSpacing: "-.6px", color: "oklch(0.98 0.008 264)", margin: "0 0 20px" }}>
          Como se chama seu escritório?
        </h2>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>
              Nome do escritório
            </label>
            <input
              name="organizationName"
              type="text"
              required
              minLength={2}
              placeholder="Ex.: Andrade Advocacia"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                border: "1px solid oklch(1 0 0 / 12%)",
                borderRadius: 11,
                background: "oklch(0.145 0.02 264)",
                color: "oklch(0.95 0.01 264)",
                font: `400 14px ${F}`,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {state?.error && (
            <div style={{ background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", font: `400 13px ${F}`, color: "oklch(0.78 0.14 22)" }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 11,
              border: "none",
              background: pending ? "oklch(0.45 0.05 274)" : `linear-gradient(135deg,${AC},${AC2})`,
              color: "#fff",
              font: `600 15px ${F}`,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Criando conta…" : "Criar conta do escritório"}
          </button>
        </form>
      </div>
    </div>
  );
}
