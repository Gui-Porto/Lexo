"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, loginWithGoogle } from "@/actions/login";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px 11px 38px",
  background: "oklch(0.165 0.02 264)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: 10,
  fontFamily: F,
  fontSize: 14,
  color: "oklch(0.90 0.01 264)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const bullets = [
  {
    bold: "Andamentos automáticos",
    text: "captados diretamente dos tribunais",
    icon: (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    bold: "Documentos e contratos",
    text: "sempre organizados e acessíveis",
    icon: (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    bold: "Acesso seguro",
    text: "protegido por criptografia e LGPD",
    icon: (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="auth-root" style={{ display: "flex", minHeight: "100vh", fontFamily: F }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { max-width: 100%; overflow-x: hidden; }
        @media (max-width: 860px) {
          .auth-root { flex-direction: column !important; }
          .auth-brand { display: none !important; }
          .auth-form { flex: 1 1 auto !important; padding: 56px 24px !important; min-height: 100vh; }
        }
        @media (max-width: 480px) {
          .auth-form { padding: 48px 18px !important; }
        }
      ` }} />

      {/* ── Brand panel (esquerda) ───────────────────────────────── */}
      <div className="auth-brand" style={{
        flex: "1.05",
        background: "oklch(0.09 0.022 264)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 56px",
        overflow: "hidden",
      }}>
        {/* Luz ambiente radial */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(800px 500px at 20% 0%, color-mix(in oklab,${AC} 22%,transparent) 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />
        {/* Blob inferior direito */}
        <div style={{
          position: "absolute",
          bottom: -80, right: -80,
          width: 360, height: 360,
          borderRadius: "50%",
          background: `color-mix(in oklab,${AC2} 12%,transparent)`,
          filter: "blur(80px)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 52, position: "relative" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.18 0.02 264)" }}>
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4.5V15H15" />
                <path d="M5 19.5h14" stroke="oklch(0.72 0.16 290)" strokeWidth={2} />
              </svg>
            </span>
            <span style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "oklch(0.98 0.008 264)", letterSpacing: "-0.6px" }}>Lexo</span>
          </Link>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: `color-mix(in oklab,${AC} 14%,oklch(0.15 0.02 264))`,
          border: `1px solid color-mix(in oklab,${AC} 28%,transparent)`,
          borderRadius: 99,
          padding: "5px 14px",
          marginBottom: 22,
          width: "fit-content",
          position: "relative",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: AC, flexShrink: 0 }} />
          <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: AC, letterSpacing: "1.2px" }}>
            FAZER LOGIN NO LEXO
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: F,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "-1.2px",
          color: "oklch(0.96 0.008 264)",
          lineHeight: 1.15,
          margin: "0 0 16px",
          maxWidth: 380,
          position: "relative",
        }}>
          Gerencie seu escritório com total controle e eficiência.
        </h1>

        <p style={{
          fontFamily: F,
          fontSize: 15,
          color: "oklch(0.65 0.02 264)",
          lineHeight: 1.68,
          margin: "0 0 38px",
          maxWidth: 360,
          position: "relative",
        }}>
          Processos, prazos, clientes e finanças — tudo em um painel inteligente e seguro.
        </p>

        {/* Bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
          {bullets.map(({ bold, text, icon }) => (
            <div key={bold} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
              <span style={{
                width: 34, height: 34,
                borderRadius: 9,
                background: `color-mix(in oklab,${AC} 14%,oklch(0.18 0.02 264))`,
                border: `1px solid color-mix(in oklab,${AC} 22%,transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: AC,
                flexShrink: 0,
              }}>
                {icon}
              </span>
              <div style={{ paddingTop: 2 }}>
                <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "oklch(0.90 0.01 264)" }}>{bold} </span>
                <span style={{ fontFamily: F, fontSize: 14, color: "oklch(0.62 0.02 264)" }}>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel (direita) ─────────────────────────────────── */}
      <div className="auth-form" style={{
        flex: "1",
        background: "oklch(0.115 0.018 264)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "64px 48px",
        position: "relative",
      }}>
        {/* Voltar ao site */}
        <div style={{ position: "absolute", top: 28, left: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: "oklch(0.58 0.02 264)", textDecoration: "none" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Voltar ao site
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: F, fontSize: 26, fontWeight: 700, letterSpacing: "-0.7px", color: "oklch(0.95 0.008 264)", margin: "0 0 6px" }}>
            Entrar na sua conta
          </h2>
          <p style={{ fontFamily: F, fontSize: 14, color: "oklch(0.58 0.02 264)", margin: "0 0 28px" }}>
            Use o e-mail cadastrado pelo seu escritório.
          </p>

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* E-mail */}
            <div>
              <label style={{ display: "block", fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.78 0.01 264)", marginBottom: 6 }}>
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "oklch(0.52 0.02 264)", pointerEvents: "none" }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@escritorio.com"
                  style={INPUT}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.78 0.01 264)" }}>
                  Senha
                </label>
                <span style={{ fontFamily: F, fontSize: 12, color: "oklch(0.50 0.02 264)", cursor: "default" }}>
                  Esqueci minha senha
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "oklch(0.52 0.02 264)", pointerEvents: "none" }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={INPUT}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "oklch(0.52 0.02 264)", padding: 0, lineHeight: 0 }}
                >
                  {showPass ? (
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Manter conectado */}
            <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
              <input type="checkbox" name="remember" style={{ accentColor: AC, width: 15, height: 15, cursor: "pointer" }} />
              <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.65 0.02 264)" }}>
                Manter-me conectado neste dispositivo
              </span>
            </label>

            {/* Erro */}
            {state?.error && (
              <div style={{ background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", fontFamily: F, fontSize: 13, color: "oklch(0.78 0.14 22)" }}>
                {state.error}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 11,
                background: pending
                  ? "oklch(0.45 0.05 274)"
                  : `linear-gradient(135deg,${AC},${AC2})`,
                border: "none",
                cursor: pending ? "not-allowed" : "pointer",
                fontFamily: F,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                boxShadow: pending ? "none" : `0 8px 24px color-mix(in oklab,${AC} 38%,transparent)`,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              {pending ? "Entrando…" : (
                <>
                  Entrar
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
            <span style={{ fontFamily: F, fontSize: 12, color: "oklch(0.48 0.02 264)" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
          </div>

          {/* Login com Google */}
          <form action={loginWithGoogle}>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 11,
                background: "oklch(0.165 0.02 264)",
                border: "1px solid oklch(1 0 0 / 10%)",
                cursor: "pointer",
                fontFamily: F,
                fontSize: 14,
                fontWeight: 600,
                color: "oklch(0.90 0.01 264)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 22,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Entrar com Google
            </button>
          </form>

          {/* Link cadastro */}
          <p style={{ textAlign: "center", fontFamily: F, fontSize: 13, color: "oklch(0.55 0.02 264)", margin: "0 0 20px" }}>
            Primeiro acesso?{" "}
            <Link href="/registrar" style={{ color: AC, fontWeight: 600, textDecoration: "none" }}>
              Ative sua conta
            </Link>
          </p>

          {/* Rodapé segurança */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="oklch(0.44 0.02 264)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontFamily: F, fontSize: 11, color: "oklch(0.44 0.02 264)" }}>
              Conexão segura · dados protegidos por LGPD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
