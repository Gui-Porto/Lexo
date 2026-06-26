"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createThread,
  deleteThread,
  getThread,
  listThreads,
  saveMessage,
} from "@/actions/ai-threads";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Thread = { id: string; title: string; updatedAt: Date };
type Message = { id: string; role: string; content: string; createdAt: Date };

// ─── Minimal markdown renderer ──────────────────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: F, fontSize: 14, lineHeight: 1.72, color: "oklch(0.88 0.01 264)" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <p key={i} style={{ fontWeight: 700, fontSize: 14, color: "oklch(0.95 0.008 264)", margin: "14px 0 4px" }}>{line.slice(3)}</p>;
        if (line.startsWith("### "))
          return <p key={i} style={{ fontWeight: 600, fontSize: 13, color: "oklch(0.88 0.01 264)", margin: "10px 0 3px" }}>{line.slice(4)}</p>;
        if (line.startsWith("- ") || line.startsWith("• "))
          return <p key={i} style={{ margin: "3px 0", paddingLeft: 14 }}>· {line.slice(2)}</p>;
        if (line === "")
          return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: "2px 0" }}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} style={{ color: "oklch(0.95 0.01 264)" }}>{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

const CHIPS = [
  { label: "Buscar jurisprudência", prompt: "Pesquise jurisprudência sobre " },
  { label: "Redigir petição", prompt: "Me ajude a redigir uma petição de " },
  { label: "Calcular prazo", prompt: "Quais são os prazos para " },
  { label: "Resumir processo", prompt: "Explique o entendimento dos tribunais sobre " },
];

const CONTEXT_ITEMS = [
  { label: "Jurisprudência STJ / STF", active: true },
  { label: "Código Civil e Processo Civil", active: true },
  { label: "CLT e legislação trabalhista", active: false },
  { label: "Acervo de processos do escritório", active: false },
];

// ─── Main component ─────────────────────────────────────────────────────────────
export function LexoAIChat({ userEmail }: { userEmail?: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [input, setInput] = useState("");
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listThreads().then((t) => setThreads(t as Thread[]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  const selectThread = useCallback(async (id: string) => {
    setActiveThreadId(id);
    setStreamBuffer("");
    const thread = await getThread(id);
    setMessages((thread?.messages ?? []) as Message[]);
  }, []);

  const newThread = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
    setStreamBuffer("");
    setInput("");
    textareaRef.current?.focus();
  }, []);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteThread(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) { setActiveThreadId(null); setMessages([]); }
  }, [activeThreadId]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    let threadId = activeThreadId;
    let isNew = false;
    if (!threadId) {
      const title = text.length > 60 ? text.slice(0, 57) + "…" : text;
      const thread = await createThread(title);
      threadId = thread.id;
      setActiveThreadId(threadId);
      setThreads((prev) => [{ id: thread.id, title: thread.title, updatedAt: thread.createdAt } as Thread, ...prev]);
      isNew = true;
    }

    const userMsg = await saveMessage(threadId, "user", text);
    const userMessage: Message = { id: userMsg.id, role: "user", content: text, createdAt: userMsg.createdAt };
    const nextMessages = isNew ? [userMessage] : [...messages, userMessage];
    setMessages(nextMessages);

    const history = nextMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    setStreaming(true);
    setStreamBuffer("");
    let accumulated = "";

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("Erro");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamBuffer(accumulated);
      }
    } catch {
      accumulated = "Não foi possível obter resposta da IA. Tente novamente.";
      setStreamBuffer(accumulated);
    } finally {
      setStreaming(false);
      setStreamBuffer("");
      if (accumulated) {
        startTransition(async () => {
          const saved = await saveMessage(threadId!, "assistant", accumulated);
          const aiMsg: Message = { id: saved.id, role: "assistant", content: accumulated, createdAt: saved.createdAt };
          setMessages((prev) => [...prev, aiMsg]);
          setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, updatedAt: new Date() } : t));
        });
      }
    }
  }, [input, streaming, activeThreadId, messages, startTransition]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0 && !streamBuffer;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, fontFamily: F }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="r-hide-lg" style={{ width: 236, flexShrink: 0, borderRight: "1px solid oklch(1 0 0 / 7%)", background: "oklch(0.10 0.016 264)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 12px 10px", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
          <button
            onClick={newThread}
            style={{ width: "100%", padding: "9px 14px", background: `color-mix(in oklab,${AC} 16%,oklch(0.16 0.02 264))`, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: F, fontSize: 13, fontWeight: 600, color: "oklch(0.94 0.01 264)" }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Nova conversa
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {threads.length === 0 ? (
            <div style={{ padding: "20px 8px", textAlign: "center", fontFamily: F, fontSize: 12, color: "oklch(0.42 0.02 264)" }}>Nenhuma conversa ainda</div>
          ) : threads.map((t) => (
            <div
              key={t.id}
              onClick={() => selectThread(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && selectThread(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9, cursor: "pointer", background: t.id === activeThreadId ? `color-mix(in oklab,${AC} 12%,oklch(0.155 0.02 264))` : "transparent", marginBottom: 2 }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={t.id === activeThreadId ? AC : "oklch(0.5 0.02 264)"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span style={{ flex: 1, minWidth: 0, fontFamily: F, fontSize: 12, fontWeight: 500, color: t.id === activeThreadId ? "oklch(0.92 0.01 264)" : "oklch(0.68 0.02 264)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.title}
              </span>
              <button
                onClick={(e) => handleDelete(t.id, e)}
                title="Excluir"
                style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.45 0.02 264)", padding: 2, borderRadius: 4, lineHeight: 0, flexShrink: 0 }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>

        {userEmail && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid oklch(1 0 0 / 6%)", fontFamily: FM, fontSize: 10, color: "oklch(0.42 0.02 264)" }}>
            {userEmail}
          </div>
        )}
      </aside>

      {/* ── Chat area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "oklch(0.115 0.018 264)" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {isEmpty ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px color-mix(in oklab,${AC} 38%,transparent)` }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "oklch(0.95 0.01 264)", margin: "0 0 7px" }}>Lexo IA</h2>
                <p style={{ fontFamily: F, fontSize: 14, color: "oklch(0.56 0.02 264)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
                  Pesquise jurisprudência, redija peças, calcule prazos e tire dúvidas sobre legislação brasileira.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 460 }}>
                {CHIPS.map((c) => (
                  <button key={c.label} onClick={() => setInput(c.prompt)} style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "oklch(0.78 0.02 264)", background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 9%)", borderRadius: 8, padding: "7px 13px", cursor: "pointer" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, margin: "0 auto" }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", gap: 13, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: msg.role === "user" ? "oklch(0.28 0.04 274)" : `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {msg.role === "user" ? (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.8 0.02 264)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                    ) : (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
                    )}
                  </div>
                  <div style={{ maxWidth: "82%", borderRadius: msg.role === "user" ? "14px 3px 14px 14px" : "3px 14px 14px 14px", padding: "12px 16px", background: msg.role === "user" ? "oklch(0.18 0.03 274)" : "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                    {msg.role === "user" ? (
                      <span style={{ fontFamily: F, fontSize: 14, color: "oklch(0.9 0.01 264)", lineHeight: 1.6 }}>{msg.content}</span>
                    ) : (
                      <MarkdownText text={msg.content} />
                    )}
                  </div>
                </div>
              ))}

              {streamBuffer && (
                <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
                  </div>
                  <div style={{ maxWidth: "82%", borderRadius: "3px 14px 14px 14px", padding: "12px 16px", background: "oklch(0.155 0.02 264)", border: `1px solid color-mix(in oklab,${AC} 20%,oklch(1 0 0 / 8%))` }}>
                    <MarkdownText text={streamBuffer} />
                    <span style={{ display: "inline-block", width: 7, height: 14, background: AC, borderRadius: 2, marginLeft: 3, verticalAlign: "text-bottom", animation: "lexo-pulse 1s ease-in-out infinite" }} />
                  </div>
                </div>
              )}

              {streaming && !streamBuffer && (
                <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
                  </div>
                  <div style={{ padding: "14px 18px", background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: "3px 14px 14px 14px", display: "flex", gap: 5, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: AC, display: "inline-block", animation: `lexo-bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "14px 24px 18px", borderTop: "1px solid oklch(1 0 0 / 6%)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", border: `1px solid ${streaming ? `color-mix(in oklab,${AC} 30%,oklch(1 0 0 / 10%))` : "oklch(1 0 0 / 10%)"}`, borderRadius: 13, background: "oklch(0.14 0.018 264)", transition: "border-color 0.2s" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder="Pergunte sobre jurisprudência, legislação, prazos…"
              rows={1}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: F, fontSize: 14, color: "oklch(0.9 0.01 264)", padding: "13px 16px 4px", caretColor: AC, lineHeight: 1.6, maxHeight: 200, overflowY: "auto", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px 10px" }}>
              <span style={{ fontFamily: FM, fontSize: 11, color: "oklch(0.40 0.02 264)" }}>Enter para enviar · Shift+Enter para quebrar linha</span>
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !streaming ? AC : "oklch(0.20 0.02 264)", border: "none", cursor: input.trim() && !streaming ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", boxShadow: input.trim() && !streaming ? `0 4px 12px color-mix(in oklab,${AC} 40%,transparent)` : "none" }}
              >
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={input.trim() && !streaming ? "#fff" : "oklch(0.4 0.02 264)"} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Context panel ────────────────────────────────────────────────── */}
      <aside className="r-hide-lg" style={{ width: 240, flexShrink: 0, borderLeft: "1px solid oklch(1 0 0 / 7%)", background: "oklch(0.10 0.016 264)", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: "oklch(0.45 0.02 264)", letterSpacing: "1px", marginBottom: 10 }}>FONTES DE CONTEXTO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CONTEXT_ITEMS.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: item.active ? AC : "oklch(0.30 0.02 264)", boxShadow: item.active ? `0 0 6px ${AC}` : "none" }} />
                <span style={{ fontFamily: F, fontSize: 12, color: item.active ? "oklch(0.80 0.01 264)" : "oklch(0.44 0.02 264)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid oklch(1 0 0 / 7%)", paddingTop: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: "oklch(0.45 0.02 264)", letterSpacing: "1px", marginBottom: 10 }}>ATALHOS RÁPIDOS</div>
          {CHIPS.map((c) => (
            <button key={c.label} onClick={() => { setInput(c.prompt); textareaRef.current?.focus(); }} style={{ display: "block", width: "100%", textAlign: "left", fontFamily: F, fontSize: 12, color: "oklch(0.62 0.02 264)", background: "transparent", border: "none", cursor: "pointer", padding: "7px 2px", borderBottom: "1px solid oklch(1 0 0 / 4%)" }}>
              {c.label} →
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid oklch(1 0 0 / 7%)", paddingTop: 16, marginTop: "auto" }}>
          <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 500, color: "oklch(0.38 0.02 264)", lineHeight: 1.6 }}>
            Powered by Gemini 2.5 Flash.<br />
            Verifique informações antes de usar em peças processuais.
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes lexo-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes lexo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
