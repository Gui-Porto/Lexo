"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loginWithTotp } from "@/actions/login-2fa";

const AC = "#cef79e";
const AC2 = "#cef79e";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

function OtpInputs({ onChange }: { onChange: (code: string) => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (i: number) => inputRefs.current[i]?.focus();
  const notify = (next: string[]) => onChange(next.join(""));

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    notify(next);
    if (digit && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
        notify(next);
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focus(i - 1);
    } else if (e.key === "ArrowRight" && i < 5) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = ["", "", "", "", "", ""];
    for (let j = 0; j < text.length; j++) next[j] = text[j];
    setDigits(next);
    notify(next);
    focus(Math.min(text.length, 5));
  };

  const boxStyle = (i: number): React.CSSProperties => ({
    width: 48,
    height: 58,
    borderRadius: 12,
    border: digits[i]
      ? `1.5px solid color-mix(in oklab,${AC} 60%,transparent)`
      : "1.5px solid #4d57571f",
    background: digits[i]
      ? `color-mix(in oklab,${AC} 10%,#222f30)`
      : "#222f30",
    fontFamily: FM,
    fontSize: 22,
    fontWeight: 600,
    color: "#ffffff",
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.15s ease, background 0.15s ease",
    caretColor: AC,
    boxSizing: "border-box",
  });

  return (
    <div
      className="otp-wrap"
      style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
      onPaste={handlePaste}
    >
      {[0, 1, 2].map((i) => (
        <input
          key={i}
          className="otp-box"
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={boxStyle(i)}
          autoFocus={i === 0}
          autoComplete={i === 0 ? "one-time-code" : "off"}
        />
      ))}
      <span style={{ color: "#93a09f", fontSize: 20, fontWeight: 300, userSelect: "none" }}>–</span>
      {[3, 4, 5].map((i) => (
        <input
          key={i}
          className="otp-box"
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={boxStyle(i)}
          autoComplete="off"
        />
      ))}
    </div>
  );
}

function TotpTimer() {
  const [secs, setSecs] = useState(() => 30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    const tick = () => {
      setSecs(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (secs / 30) * 100;
  const r = 8;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const urgent = secs <= 7;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
      <svg width={20} height={20} viewBox="0 0 20 20">
        <circle cx={10} cy={10} r={r} fill="none" stroke="#4d5757" strokeWidth={2} />
        <circle
          cx={10} cy={10} r={r}
          fill="none"
          stroke={urgent ? "var(--destructive)" : AC}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 10 10)"
          style={{ transition: "stroke-dasharray 0.9s linear" }}
        />
      </svg>
      <span style={{
        fontFamily: F,
        fontSize: 13,
        color: urgent ? "var(--destructive)" : "#93a09f",
      }}>
        Código válido por{" "}
        <span style={{ fontFamily: FM, fontWeight: 600, color: urgent ? "var(--destructive)" : "#93a09f" }}>
          {secs}s
        </span>
      </span>
    </div>
  );
}

export default function TwoFactorPage() {
  const [state, formAction, pending] = useActionState(loginWithTotp, undefined);
  const [code, setCode] = useState("");

  const ready = code.length === 6;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a2425",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: F,
      padding: "24px 16px",
      position: "relative",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { max-width: 100%; overflow-x: hidden; }
        @media (max-width: 480px) {
          .twofa-card { padding: 32px 20px !important; }
          .otp-wrap { gap: 6px !important; }
          .otp-box { width: 42px !important; height: 52px !important; font-size: 19px !important; }
        }
        @media (max-width: 360px) {
          .otp-wrap { gap: 4px !important; }
          .otp-box { width: 36px !important; height: 46px !important; font-size: 17px !important; }
        }
      ` }} />
      {/* Luz ambiente radial */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(900px 700px at 50% -10%, color-mix(in oklab,${AC} 16%,transparent) 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />

      {/* Voltar ao login */}
      <div style={{ position: "absolute", top: 24, left: 28 }}>
        <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 13, color: "#93a09f", textDecoration: "none" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar ao login
        </Link>
      </div>

      {/* Logo */}
      <div style={{ position: "absolute", top: 24, right: 28 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#222f30" }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4.5V15H15" />
              <path d="M5 19.5h14" stroke="#cef79e" strokeWidth={2} />
            </svg>
          </span>
          <span style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.5px" }}>
            Lexo
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="twofa-card" style={{
        width: "100%",
        maxWidth: 440,
        background: "#222f30",
        borderRadius: 20,
        border: "1px solid #4d5757",
        padding: "40px 36px 36px",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Shield icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: `linear-gradient(135deg, color-mix(in oklab,${AC} 20%,#222f30), color-mix(in oklab,${AC2} 14%,#222f30))`,
            border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={AC} />
                  <stop offset="100%" stopColor={AC2} />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shield-grad)" />
              <path d="M9 12l2 2 4-4" stroke="url(#shield-grad)" />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h2 style={{
          fontFamily: F,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.6px",
          color: "#ffffff",
          textAlign: "center",
          margin: "0 0 8px",
        }}>
          Verificação em duas etapas
        </h2>
        <p style={{
          fontFamily: F,
          fontSize: 14,
          color: "#93a09f",
          textAlign: "center",
          lineHeight: 1.6,
          margin: "0 0 24px",
        }}>
          Abra o Google Authenticator e digite o código de 6 dígitos gerado para a sua conta Lexo.
        </p>

        {/* Chip Google Authenticator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#222f30",
          border: "1px solid #4d5757",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 28,
        }}>
          {/* Google color logo */}
          <svg width={20} height={20} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
              Google Authenticator
            </div>
            <div style={{ fontFamily: FM, fontSize: 11, color: "#93a09f", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              conta@escritorio.com
            </div>
          </div>
          <div style={{
            background: `color-mix(in oklab,${AC} 14%,#283738)`,
            border: `1px solid color-mix(in oklab,${AC} 25%,transparent)`,
            borderRadius: 99,
            padding: "3px 10px",
            fontFamily: FM,
            fontSize: 10,
            fontWeight: 500,
            color: AC,
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}>
            VINCULADO
          </div>
        </div>

        {/* Form */}
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
          <input type="hidden" name="totpCode" value={code} readOnly />

          {/* 6 inputs OTP */}
          <OtpInputs onChange={setCode} />

          {/* Timer */}
          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <TotpTimer />
          </div>

          {/* Checkbox confiar dispositivo */}
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", marginBottom: 20 }}>
            <input
              type="checkbox"
              name="trust"
              style={{ accentColor: AC, width: 15, height: 15, cursor: "pointer" }}
            />
            <span style={{ fontFamily: F, fontSize: 13, color: "#93a09f" }}>
              Confiar neste dispositivo por 30 dias
            </span>
          </label>

          {/* Erro */}
          {state?.error && (
            <div style={{
              background: "oklch(0.62 0.18 22 / 12%)",
              border: "1px solid oklch(0.62 0.18 22 / 28%)",
              borderRadius: 9,
              padding: "10px 14px",
              fontFamily: F,
              fontSize: 13,
              color: "oklch(0.78 0.14 22)",
              marginBottom: 16,
            }}>
              {state.error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={!ready || pending}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 11,
              background: (!ready || pending)
                ? "#283738"
                : `linear-gradient(135deg,${AC},${AC2})`,
              border: (!ready || pending)
                ? "1px solid #4d5757"
                : "none",
              cursor: (!ready || pending) ? "not-allowed" : "pointer",
              fontFamily: F,
              fontSize: 15,
              fontWeight: 600,
              color: (!ready || pending) ? "#93a09f" : "#222f30",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: (!ready || pending) ? 0.55 : 1,
            }}
          >
            {pending ? "Verificando…" : (
              <>
                Verificar e entrar
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Link código de backup */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, color: "#93a09f", textDecoration: "underline", textDecorationColor: "#93a09f", textUnderlineOffset: 3, padding: 0 }}
            onClick={() => {}}
          >
            Sem acesso ao app? Usar um código de backup
          </button>
        </div>
      </div>

      {/* Rodapé segurança */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 24, position: "relative", zIndex: 1 }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#93a09f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ fontFamily: F, fontSize: 11, color: "#93a09f" }}>
          Conexão segura · dados protegidos por LGPD
        </span>
      </div>
    </div>
  );
}
