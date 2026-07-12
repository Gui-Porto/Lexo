"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { completeGoogleSignup } from "@/actions/auth";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

const TEAM_SIZES = [
  { value: "solo", label: "Só eu" },
  { value: "2-5", label: "2 a 5 advogados" },
  { value: "6-15", label: "6 a 15 advogados" },
  { value: "16-50", label: "16 a 50 advogados" },
  { value: "50+", label: "Mais de 50" },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function CompleteSignupForm({ email, name }: { email: string; name: string }) {
  const [state, formAction, pending] = useActionState(completeGoogleSignup, undefined);
  const [teamSizeOpen, setTeamSizeOpen] = useState(false);
  const [teamSizeValue, setTeamSizeValue] = useState("");

  return (
    <div className="auth-root" style={{ display: "flex", minHeight: "100vh", fontFamily: F }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { max-width: 100%; overflow-x: hidden; }
        @media (max-width: 900px) {
          .auth-root { flex-direction: column !important; }
          .auth-brand { display: none !important; }
          .auth-form { flex: 1 1 auto !important; padding: 48px 24px !important; min-height: 100vh; }
        }
        @media (max-width: 480px) {
          .auth-form { padding: 40px 18px !important; }
        }
      ` }} />

      {/* ── LEFT BRAND ─────────────────────────────────────────────── */}
      <div className="auth-brand" style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        padding: "48px 52px",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(155deg, oklch(0.14 0.03 280), oklch(0.10 0.018 264))",
      }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(900px 600px at 20% 0%, color-mix(in oklab,${AC} 22%,transparent), transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab,${AC2} 25%,transparent), transparent)`, filter: "blur(30px)", right: -140, bottom: -120, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab,${AC} 18%,transparent), transparent)`, filter: "blur(24px)", left: 10, top: 100, pointerEvents: "none" }} />

        <Link href="/" style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.18 0.02 264)" }}>
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4.5V15H15" />
              <path d="M5 19.5h14" stroke="oklch(0.72 0.16 290)" strokeWidth={2} />
            </svg>
          </span>
          <span style={{ font: `700 22px ${F}`, letterSpacing: "-0.6px", color: "oklch(0.98 0.008 264)" }}>Lexo</span>
        </Link>

        <div style={{ position: "relative", marginTop: "auto", paddingTop: 56 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, font: `500 11px ${FM}`, color: "oklch(0.82 0.05 274)", border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, background: `color-mix(in oklab,${AC} 12%,transparent)`, borderRadius: 999, padding: "5px 12px", letterSpacing: ".5px" }}>
            ÚLTIMO PASSO
          </span>

          <h1 style={{ font: `800 40px ${F}`, lineHeight: 1.1, letterSpacing: "-1.5px", color: "oklch(0.98 0.008 264)", margin: "20px 0 0", maxWidth: 420 }}>
            Sua identidade já{" "}
            <span style={{ background: `linear-gradient(90deg,${AC},${AC2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              foi confirmada.
            </span>
          </h1>
          <p style={{ font: `400 15px ${F}`, lineHeight: 1.65, color: "oklch(0.66 0.02 264)", maxWidth: 390, margin: "14px 0 0" }}>
            Só falta configurar o escritório. Essas informações ajudam a personalizar prazos, faturas e permissões da sua equipe.
          </p>

          {/* Conta Google confirmada */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, padding: "14px 16px", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 13, background: "oklch(1 0 0 / 4%)" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `600 14px ${F}`, color: "#fff", background: `linear-gradient(135deg,${AC},${AC2})` }}>
              {initials(name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: `600 13px ${F}`, color: "oklch(0.92 0.01 264)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ font: `400 12px ${F}`, color: "oklch(0.55 0.02 264)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
            </div>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.15 150)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ─────────────────────────────────────────────── */}
      <div className="auth-form" style={{ flex: 1.12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 52px", background: "oklch(0.115 0.018 264)", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h2 style={{ font: `700 26px ${F}`, letterSpacing: "-.7px", color: "oklch(0.98 0.008 264)", margin: 0 }}>
            Como se chama seu escritório?
          </h2>
          <p style={{ font: `400 14px ${F}`, color: "oklch(0.56 0.02 264)", margin: "6px 0 20px" }}>
            OAB e telefone são opcionais — dá pra completar depois em Configurações.
          </p>

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Conta Google confirmada — sempre visível, inclusive no mobile onde o painel de marca some */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2, padding: "9px 14px 9px 9px", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 999, background: "oklch(1 0 0 / 4%)", maxWidth: "100%", minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `600 11px ${F}`, color: "#fff", background: `linear-gradient(135deg,${AC},${AC2})` }}>
                {initials(name)}
              </div>
              <span style={{ font: `500 13px ${F}`, color: "oklch(0.85 0.01 264)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.15 150)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            {/* Nome do escritório */}
            <div>
              <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>Nome do escritório</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                <span style={{ color: "oklch(0.5 0.02 264)", display: "flex", flexShrink: 0 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 12h.01M9 15h.01"/></svg>
                </span>
                <input name="organizationName" type="text" required minLength={2} placeholder="Ex.: Andrade Advocacia" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
              </div>
            </div>

            {/* OAB */}
            <div>
              <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>
                OAB <span style={{ color: "oklch(0.42 0.02 264)", fontWeight: 400 }}>(opcional)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                <input name="oab" type="text" placeholder="SP 000.000" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
              </div>
            </div>

            {/* Telefone + Tamanho da equipe */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>Telefone</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                  <span style={{ color: "oklch(0.5 0.02 264)", display: "flex", flexShrink: 0 }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5A16 16 0 0 0 12 12.59 16 16 0 0 0 15.5 16.08l.86-.86a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 23 17.5"/></svg>
                  </span>
                  <input name="phone" type="tel" placeholder="(11) 99999-9999" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>Tamanho da equipe</label>
                <div style={{ position: "relative" }}>
                  <input type="hidden" name="teamSize" value={teamSizeValue} />
                  {teamSizeOpen && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setTeamSizeOpen(false)} />
                  )}
                  <button
                    type="button"
                    onClick={() => setTeamSizeOpen((v) => !v)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 46, border: `1px solid ${teamSizeOpen ? AC : "oklch(1 0 0 / 12%)"}`, borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)", cursor: "pointer", transition: "border-color .15s" }}
                  >
                    <span style={{ font: `400 14px ${F}`, color: teamSizeValue ? "oklch(0.95 0.01 264)" : "oklch(0.44 0.02 264)" }}>
                      {teamSizeValue ? TEAM_SIZES.find((o) => o.value === teamSizeValue)?.label : "Selecione"}
                    </span>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.5 0.02 264)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: teamSizeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  {teamSizeOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "oklch(0.16 0.022 264)", border: "1px solid oklch(1 0 0 / 14%)", borderRadius: 11, overflow: "hidden", zIndex: 10, boxShadow: "0 8px 24px oklch(0 0 0 / 40%)" }}>
                      {TEAM_SIZES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setTeamSizeValue(opt.value); setTeamSizeOpen(false); }}
                          style={{ width: "100%", textAlign: "left", padding: "11px 14px", font: `400 14px ${F}`, color: teamSizeValue === opt.value ? AC : "oklch(0.88 0.01 264)", background: teamSizeValue === opt.value ? `color-mix(in oklab,${AC} 10%,transparent)` : "transparent", border: "none", cursor: "pointer", display: "block" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                font: `600 15px ${F}`,
                color: "#fff",
                borderRadius: 11, height: 50, border: "none",
                background: pending ? "oklch(0.45 0.05 274)" : `linear-gradient(135deg,${AC},${AC2})`,
                boxShadow: pending ? "none" : `0 10px 28px color-mix(in oklab,${AC} 36%,transparent)`,
                cursor: pending ? "not-allowed" : "pointer",
                transition: "all .2s",
                marginTop: 4,
              }}
            >
              {pending ? "Criando conta…" : (
                <>
                  Criar conta do escritório
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
