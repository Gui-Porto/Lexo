"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { registerOrganization, signupWithGoogle } from "@/actions/auth";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

function pwStrength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

const STRENGTH = [
  { w: "0%",   c: "oklch(0.55 0.02 264)", l: "—" },
  { w: "33%",  c: "oklch(0.68 0.2 25)",   l: "Fraca" },
  { w: "66%",  c: "oklch(0.78 0.16 80)",  l: "Razoável" },
  { w: "85%",  c: "oklch(0.78 0.14 130)", l: "Boa" },
  { w: "100%", c: "oklch(0.72 0.15 150)", l: "Forte" },
];

const TEAM_SIZES = [
  { value: "solo",  label: "Só eu" },
  { value: "2-5",   label: "2 a 5 advogados" },
  { value: "6-15",  label: "6 a 15 advogados" },
  { value: "16-50", label: "16 a 50 advogados" },
  { value: "50+",   label: "Mais de 50" },
];

const BENEFITS = [
  {
    text: "Migração e treinamento sem custo adicional",
    icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  },
  {
    text: "Usuários ilimitados durante os 14 dias",
    icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    text: "Dados protegidos por LGPD e ISO 27001",
    icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
];

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerOrganization, null);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [terms, setTerms] = useState(false);
  const [officeFocused, setOfficeFocused] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [teamSizeOpen, setTeamSizeOpen] = useState(false);
  const [teamSizeValue, setTeamSizeValue] = useState("");

  const orgNameRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const lv = STRENGTH[pwd ? pwStrength(pwd) : 0];
  const canSubmit = terms && !pending;

  function validateStep1(): boolean {
    return !!(
      orgNameRef.current?.value &&
      nameRef.current?.value &&
      teamSizeValue
    );
  }

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

        {/* Logo */}
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
            TESTE GRÁTIS · 14 DIAS · SEM CARTÃO
          </span>

          <h1 style={{ font: `800 40px ${F}`, lineHeight: 1.1, letterSpacing: "-1.5px", color: "oklch(0.98 0.008 264)", margin: "20px 0 0", maxWidth: 420 }}>
            Tire o seu escritório<br />do caos em{" "}
            <span style={{ background: `linear-gradient(90deg,${AC},${AC2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              poucos minutos.
            </span>
          </h1>
          <p style={{ font: `400 15px ${F}`, lineHeight: 1.65, color: "oklch(0.66 0.02 264)", maxWidth: 390, margin: "14px 0 0" }}>
            Centralize processos, prazos e financeiro. Sua equipe começa a usar no mesmo dia.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", marginTop: 26, border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 13, overflow: "hidden" }}>
            {[["620+", "escritórios"], ["4.9 ★", "avaliação média"], ["2 min", "p/ configurar"]].map(([n, l], i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "14px 10px", background: "oklch(1 0 0 / 4%)", borderLeft: i > 0 ? "1px solid oklch(1 0 0 / 8%)" : undefined }}>
                <div style={{ font: `700 22px ${F}`, color: "oklch(0.98 0.008 264)" }}>{n}</div>
                <div style={{ font: `400 11px ${F}`, color: "oklch(0.52 0.02 264)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 22 }}>
            {BENEFITS.map(({ text, icon }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: AC, background: `color-mix(in oklab,${AC} 13%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 22%,transparent)` }}>
                  {icon}
                </span>
                <span style={{ font: `500 14px ${F}`, color: "oklch(0.84 0.01 264)" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ marginTop: 24, padding: "18px 20px", background: "oklch(1 0 0 / 5%)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 14 }}>
            <div style={{ color: "oklch(0.78 0.16 80)", fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>★★★★★</div>
            <p style={{ margin: 0, font: `400 13px ${F}`, color: "oklch(0.74 0.02 264)", lineHeight: 1.65 }}>
              &ldquo;O Lexo reduziu o tempo de abertura de processos em 70%. A equipe adaptou em dois dias.&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center", font: `600 13px ${F}`, color: "#fff", flexShrink: 0 }}>F</div>
              <div>
                <div style={{ font: `600 13px ${F}`, color: "oklch(0.9 0.01 264)" }}>Fernanda Lima</div>
                <div style={{ font: `400 11px ${F}`, color: "oklch(0.52 0.02 264)" }}>Lima &amp; Faria Advocacia · Curitiba</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ─────────────────────────────────────────────── */}
      <div className="auth-form" style={{ flex: 1.12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 52px", background: "oklch(0.115 0.018 264)", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Top nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            {step === 1 ? (
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, font: `500 13px ${F}`, color: "oklch(0.52 0.02 264)", textDecoration: "none" }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                Voltar
              </Link>
            ) : (
              <button type="button" onClick={() => setStep(1)} style={{ display: "inline-flex", alignItems: "center", gap: 7, font: `500 13px ${F}`, color: "oklch(0.52 0.02 264)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                Voltar
              </button>
            )}
            <span style={{ font: `500 11px ${FM}`, color: "oklch(0.42 0.02 264)", letterSpacing: ".4px" }}>
              PASSO {step} DE 2
            </span>
          </div>

          {/* Step bar */}
          <div style={{ height: 3, borderRadius: 99, background: "oklch(1 0 0 / 10%)", marginBottom: 22, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: AC, width: step === 1 ? "50%" : "100%", transition: "width 0.35s ease" }} />
          </div>

          <h2 style={{ font: `700 26px ${F}`, letterSpacing: "-.7px", color: "oklch(0.98 0.008 264)", margin: 0 }}>
            {step === 1 ? "Cadastre seu escritório" : "Acesso à conta"}
          </h2>
          <p style={{ font: `400 14px ${F}`, color: "oklch(0.56 0.02 264)", margin: "6px 0 20px" }}>
            {step === 1 ? "Leva menos de 2 minutos. Você será o administrador." : "Defina o e-mail e senha para entrar no Lexo."}
          </p>

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Hidden confirmPassword mirrors the password field */}
            <input type="hidden" name="confirmPassword" value={pwd} />

            {/* ── STEP 1 FIELDS ────────────────────────────────────── */}
            <div style={{ display: step === 1 ? "contents" : "none" }}>

              {/* Nome do escritório */}
              <div>
                <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>Nome do escritório</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, border: `1px solid ${officeFocused ? AC : "oklch(1 0 0 / 12%)"}`, borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)", transition: "border-color .15s" }}>
                  <span style={{ color: "oklch(0.5 0.02 264)", display: "flex", flexShrink: 0 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 12h.01M9 15h.01"/></svg>
                  </span>
                  <input ref={orgNameRef} name="organizationName" type="text" required placeholder="Ex.: Andrade Advocacia" onFocus={() => setOfficeFocused(true)} onBlur={() => setOfficeFocused(false)} style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
                </div>
              </div>

              {/* Seu nome */}
              <div>
                <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>Seu nome</label>
                <div style={{ display: "flex", alignItems: "center", height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                  <input ref={nameRef} name="name" type="text" required placeholder="Nome completo" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
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

              {/* Avançar */}
              <button
                type="button"
                onClick={() => { if (validateStep1()) setStep(2); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  font: `600 15px ${F}`,
                  color: "#fff",
                  borderRadius: 11, height: 50, border: "none",
                  background: `linear-gradient(135deg,${AC},${AC2})`,
                  boxShadow: `0 10px 28px color-mix(in oklab,${AC} 36%,transparent)`,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >
                Avançar →
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
                <span style={{ font: `400 12px ${F}`, color: "oklch(0.48 0.02 264)" }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
              </div>

              <form action={signupWithGoogle}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 11,
                    background: "oklch(0.165 0.02 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    cursor: "pointer",
                    font: `600 14px ${F}`,
                    color: "oklch(0.90 0.01 264)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                  Continuar com Google
                </button>
              </form>
            </div>

            {/* ── STEP 2 FIELDS ────────────────────────────────────── */}
            <div style={{ display: step === 2 ? "contents" : "none" }}>

              {/* E-mail */}
              <div>
                <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>E-mail de trabalho</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                  <span style={{ color: "oklch(0.5 0.02 264)", display: "flex", flexShrink: 0 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
                  </span>
                  <input name="email" type="email" required placeholder="voce@escritorio.com.br" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none" }} />
                </div>
              </div>

              {/* Senha + strength meter */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <label style={{ font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)" }}>Crie uma senha</label>
                  <span style={{ font: `400 12px ${F}`, color: "oklch(0.44 0.02 264)" }}>Mín. 8 caracteres</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, border: "1px solid oklch(1 0 0 / 12%)", borderRadius: 11, padding: "0 14px", background: "oklch(0.145 0.02 264)" }}>
                  <span style={{ color: "oklch(0.5 0.02 264)", display: "flex", flexShrink: 0 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    name="password"
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="••••••••"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", color: "oklch(0.95 0.01 264)", font: `400 14px ${F}`, outline: "none", letterSpacing: ".8px" }}
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} style={{ color: "oklch(0.55 0.02 264)", display: "flex", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
                    {showPwd ? (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.67 2.68"/><path d="M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6"/><path d="M1 1l22 22"/></svg>
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 99, background: "oklch(1 0 0 / 9%)", overflow: "hidden" }}>
                    <div style={{ width: lv.w, height: "100%", background: lv.c, borderRadius: 99, transition: "width .25s, background .25s" }} />
                  </div>
                  <span style={{ font: `500 11px ${FM}`, color: lv.c, minWidth: 54, textAlign: "right" }}>{lv.l}</span>
                </div>
              </div>

              {/* Terms */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
                <span
                  onClick={() => setTerms((v) => !v)}
                  style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${terms ? AC : "oklch(1 0 0 / 16%)"}`, background: terms ? AC : "oklch(0.145 0.02 264)", color: "#fff", transition: "background .15s, border .15s" }}
                >
                  {terms && (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </span>
                <span style={{ font: `400 13px ${F}`, color: "oklch(0.66 0.02 264)", lineHeight: 1.5 }}>
                  Li e concordo com os{" "}
                  <Link href="#" style={{ color: AC, fontWeight: 600, textDecoration: "none" }}>Termos de Uso</Link>{" "}
                  e a{" "}
                  <Link href="#" style={{ color: AC, fontWeight: 600, textDecoration: "none" }}>Política de Privacidade</Link>.
                </span>
              </label>

              {/* Error */}
              {state && "error" in state && (
                <div style={{ background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", font: `400 13px ${F}`, color: "oklch(0.78 0.14 22)" }}>
                  {state.error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  font: `600 15px ${F}`,
                  color: canSubmit ? "#fff" : "oklch(0.48 0.02 264)",
                  borderRadius: 11, height: 50, border: "none",
                  background: canSubmit ? `linear-gradient(135deg,${AC},${AC2})` : "oklch(1 0 0 / 7%)",
                  boxShadow: canSubmit ? `0 10px 28px color-mix(in oklab,${AC} 36%,transparent)` : "none",
                  opacity: canSubmit ? 1 : 0.7,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  transition: "all .2s",
                }}
              >
                {pending ? "Criando conta…" : (
                  <>
                    Criar conta do escritório
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <p style={{ textAlign: "center", font: `400 13px ${F}`, color: "oklch(0.52 0.02 264)", marginTop: 18 }}>
            Já tem conta?{" "}
            <Link href="/login" style={{ color: AC, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
