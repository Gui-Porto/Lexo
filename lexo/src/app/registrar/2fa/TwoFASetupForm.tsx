"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { confirmTwoFactorSetup } from "@/actions/totp";

const AC = "#cef79e";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

interface Props {
  qrDataUrl: string;
  email: string;
}

export function TwoFASetupForm({ qrDataUrl, email }: Props) {
  const [state, formAction] = useActionState(confirmTwoFactorSetup, undefined);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const allFilled = code.every((c) => c !== "");
  const codeStr = code.join("");

  function handleInput(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, "").slice(-1);
    setCode((prev) => { const next = [...prev]; next[i] = d; return next; });
    if (d && i < 5 && refs.current[i + 1]) refs.current[i + 1]!.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      setCode((prev) => { const next = [...prev]; next[i - 1] = ""; return next; });
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    text.split("").forEach((c, j) => { next[j] = c; });
    setCode(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  const boxStyle = (active: boolean): React.CSSProperties => ({
    width: 52, height: 58, textAlign: "center", borderRadius: 12,
    border: `1px solid ${active ? AC : "#4d5757"}`,
    background: active
      ? `color-mix(in oklab,${AC} 12%,#222f30)`
      : "#222f30",
    color: "#ffffff", font: `600 24px ${FM}`,
    boxShadow: active ? `0 0 0 3px color-mix(in oklab,${AC} 22%,transparent)` : "none",
    transition: "all .15s", caretColor: AC, outline: "none", flex: "1", minWidth: 0,
  });

  const BENEFITS = [
    {
      text: "Bloqueia logins indevidos mesmo com a senha vazada",
      icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>,
    },
    {
      text: "Funciona offline, direto no seu celular",
      icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
    },
    {
      text: "Você gerencia os dispositivos confiáveis quando quiser",
      icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
  ];

  return (
    <div className="auth-root" style={{
      fontFamily: F, color: "#ffffff", minHeight: "100vh",
      display: "grid", gridTemplateColumns: "1fr 1.12fr",
      background: "#1a2425",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { max-width: 100%; overflow-x: hidden; }
        @media (max-width: 900px) {
          .auth-root { grid-template-columns: 1fr !important; }
          .auth-brand { display: none !important; }
          .auth-form { padding: 48px 24px !important; min-height: 100vh; }
        }
        @media (max-width: 560px) {
          .twofa-qrrow { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          .auth-form { padding: 40px 18px !important; }
        }
      ` }} />

      {/* ── LEFT BRAND ─────────────────────────────────────────────── */}
      <div className="auth-brand" style={{
        position: "relative", overflow: "hidden", padding: "48px 52px",
        display: "flex", flexDirection: "column",
        background: `radial-gradient(900px 600px at 20% 0%, color-mix(in oklab,${AC} 22%,transparent), transparent 60%), linear-gradient(155deg, #222f30, #1a2425)`,
      }}>
        {/* FIXME(theme): glow orb decorativo — design é flat/zero-glow, avaliar se deve ser removido; mantido com tom Lime por ora */}
        <div style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab,${AC} 25%,transparent), transparent)`, filter: "blur(30px)", right: -140, bottom: -120, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(closest-side, color-mix(in oklab,${AC} 18%,transparent), transparent)`, filter: "blur(24px)", left: 10, top: 100, pointerEvents: "none" }} />

        <Link href="/" style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#222f30" }}>
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4.5V15H15" />
              <path d="M5 19.5h14" stroke={AC} strokeWidth={2} />
            </svg>
          </span>
          <span style={{ font: `700 22px ${F}`, letterSpacing: "-0.6px", color: "#ffffff" }}>Lexo</span>
        </Link>

        <div style={{ position: "relative", marginTop: "auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, font: `500 11px ${FM}`, color: AC, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, background: `color-mix(in oklab,${AC} 12%,transparent)`, borderRadius: 999, padding: "5px 12px", letterSpacing: ".5px" }}>
            PASSO FINAL · SEGURANÇA DA CONTA
          </span>

          <h1 style={{ font: `800 40px ${F}`, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#ffffff", margin: "20px 0 0", maxWidth: 430 }}>
            Mais uma camada e sua conta fica{" "}
            <span style={{ background: AC, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              blindada.
            </span>
          </h1>
          <p style={{ font: `400 15px ${F}`, lineHeight: 1.65, color: "#93a09f", maxWidth: 400, margin: "14px 0 0" }}>
            A verificação em duas etapas impede que invasores acessem os dados do seu escritório — mesmo que descubram a sua senha.
          </p>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 26 }}>
            {BENEFITS.map(({ text, icon }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: AC, background: `color-mix(in oklab,${AC} 13%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 22%,transparent)` }}>
                  {icon}
                </span>
                {/* FIXME(theme): texto secundário nessa faixa de luminosidade (0.70–0.90) não tem banda explícita na regra de mapeamento; colapsado em Mist por consistência com "uma hierarquia, um tom" */}
                <span style={{ font: `500 14px ${F}`, color: "#93a09f" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Compliance strip */}
          <div style={{ display: "flex", marginTop: 26, border: "1px solid #4d5757", borderRadius: 13, overflow: "hidden" }}>
            {[["LGPD", "conformidade"], ["ISO 27001", "certificado"], ["AES-256", "criptografia"]].map(([n, l], i) => (
              <div key={n} style={{ flex: 1, textAlign: "center", padding: "14px 10px", background: "#4d5757", borderLeft: i > 0 ? "1px solid #4d5757" : undefined }}>
                <div style={{ font: `700 17px ${F}`, color: "#ffffff" }}>{n}</div>
                <div style={{ font: `400 11px ${F}`, color: "#93a09f", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ─────────────────────────────────────────────── */}
      <div className="auth-form" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 52px", background: "#222f30", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 448 }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Link href="/registrar" style={{ display: "inline-flex", alignItems: "center", gap: 7, font: `500 13px ${F}`, color: "#93a09f", textDecoration: "none" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
              Voltar
            </Link>
            <span style={{ font: `500 11px ${FM}`, color: "#93a09f", letterSpacing: ".4px" }}>PASSO 2 DE 2</span>
          </div>

          {/* Step bar — both filled */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: AC }} />
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: AC }} />
          </div>

          <h2 style={{ font: `700 26px ${F}`, letterSpacing: "-.7px", color: "#ffffff", margin: 0 }}>
            Ative a verificação em duas etapas
          </h2>
          <p style={{ font: `400 14px ${F}`, color: "#93a09f", margin: "6px 0 20px" }}>
            Vincule o Google Authenticator para proteger o acesso de administrador. Leva menos de 1 minuto.
          </p>

          {/* Setup panel */}
          <div style={{ border: "1px solid #4d5757", borderRadius: 16, background: "#222f30", overflow: "hidden" }}>

            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderBottom: "1px solid #4d5757", background: "#222f30" }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <svg width={19} height={19} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.93 9.14 4.75 12 4.75z"/>
                </svg>
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ font: `600 13px ${F}`, color: "#ffffff" }}>Google Authenticator</div>
                <div style={{ font: `400 12px ${F}`, color: "#93a09f" }}>Lexo · {email}</div>
              </div>
              <span style={{
                font: `500 10px ${FM}`,
                color: allFilled ? "oklch(0.78 0.14 150)" : "oklch(0.78 0.13 80)",
                background: allFilled ? "oklch(0.72 0.15 150 / 0.13)" : "oklch(0.78 0.16 80 / 0.12)",
                border: `1px solid ${allFilled ? "oklch(0.72 0.15 150 / 0.35)" : "oklch(0.78 0.16 80 / 0.3)"}`,
                borderRadius: 999, padding: "4px 11px", flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: allFilled ? "oklch(0.78 0.14 150)" : "oklch(0.8 0.14 80)", display: "inline-block" }} />
                {allFilled ? "Confirmado" : "Aguardando código"}
              </span>
            </div>

            {/* QR + steps */}
            <div className="twofa-qrrow" style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 16px" }}>
              <div style={{ width: 156, height: 156, flexShrink: 0, background: "#fff", borderRadius: 12, padding: 13, boxShadow: "0 6px 18px oklch(0 0 0 / 0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code Google Authenticator" width={130} height={130} style={{ display: "block" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Abra o Google Authenticator no celular",
                  <span key="2">Toque em <b style={{ color: "#ffffff", fontWeight: 600 }}>+</b> e escaneie este QR Code</span>,
                  "Digite o código de 6 dígitos aqui embaixo",
                ].map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `700 12px ${F}`, color: AC, background: `color-mix(in oklab,${AC} 15%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)` }}>
                      {i + 1}
                    </span>
                    <span style={{ font: `500 13.5px ${F}`, color: "#93a09f", lineHeight: 1.45 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* OTP form */}
          <form action={formAction}>
            <input type="hidden" name="code" value={codeStr} readOnly />

            <div style={{ marginTop: 22 }}>
              <label style={{ font: `500 13px ${F}`, color: "#93a09f" }}>
                Confirme com o código gerado
              </label>
              <div style={{ display: "flex", gap: 9, justifyContent: "space-between", marginTop: 11 }}>
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    style={boxStyle(!!code[i])}
                  />
                ))}
                <span style={{ display: "flex", alignItems: "center", color: "#93a09f", font: `600 20px ${F}` }}>–</span>
                {[3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    style={boxStyle(!!code[i])}
                  />
                ))}
              </div>
            </div>

            {state?.error && (
              <div style={{ marginTop: 14, background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", font: `400 13px ${F}`, color: "oklch(0.78 0.14 22)" }}>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={!allFilled}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 22,
                font: `600 15px ${F}`, width: "100%", border: "none",
                color: allFilled ? "#222f30" : "#93a09f",
                borderRadius: 12, height: 50,
                background: allFilled ? AC : "#4d5757",
                opacity: allFilled ? 1 : 0.7,
                cursor: allFilled ? "pointer" : "not-allowed",
                transition: "all .2s",
              }}
            >
              Concluir cadastro e entrar
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
