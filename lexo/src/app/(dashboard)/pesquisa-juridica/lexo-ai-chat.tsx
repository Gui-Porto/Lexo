"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string; ts: number };
type Conversation = { id: string; title: string; messages: Message[]; createdAt: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

const STORAGE_KEY = "lexo-ai-conversations";

const CHIPS = [
  { label: "Buscar jurisprudência", prompt: "Busque jurisprudência relevante sobre " },
  { label: "Redigir petição", prompt: "Auxilie-me a redigir uma petição sobre " },
  { label: "Calcular prazo", prompt: "Quais são os prazos processuais para " },
  { label: "Resumir processo", prompt: "Resuma os pontos principais de jurisprudência sobre " },
];

const CONTEXT_SOURCES = [
  { label: "Jurisprudência STJ / STF", active: true },
  { label: "Código Civil e Processo Civil", active: true },
  { label: "CLT e legislação trabalhista", active: false },
  { label: "Acervo de processos do escritório", active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Timestamp({ ts }: { ts: number }) {
  const d = new Date(ts);
  return (
    <span style={{ fontFamily: FM, fontSize: 10, color: "oklch(0.40 0.02 264)" }}>
      {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function MarkdownText({ text }: { text: string }) {
  // Very minimal markdown: bold (**text**), headings (## H), code blocks
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: F, fontSize: 14, lineHeight: 1.7, color: "oklch(0.88 0.01 264)" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <p key={i} style={{ fontWeight: 700, fontSize: 13, color: "oklch(0.94 0.008 264)", marginTop: i > 0 ? 14 : 0, marginBottom: 4 }}>
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <p key={i} style={{ fontWeight: 600, fontSize: 13, color: "oklch(0.90 0.01 264)", marginTop: 10, marginBottom: 2 }}>
              {line.slice(4)}
            </p>
          );
        }
        // Replace **bold**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} style={{ color: "oklch(0.94 0.008 264)", fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        );
        return <p key={i} style={{ margin: 0, minHeight: line ? undefined : "0.4em" }}>{rendered}</p>;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LexoAIChat({ userEmail }: { userEmail?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hydrated, setHydrated] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  // Load from localStorage after hydration
  useEffect(() => {
    const saved = loadConversations();
    setConversations(saved);
    if (saved.length > 0) setActiveId(saved[0].id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingContent]);

  function newConversation() {
    const conv: Conversation = { id: newId(), title: "Nova conversa", messages: [], createdAt: Date.now() };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setInput("");
    setStreamingContent("");
  }

  function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  async function sendMessage(text?: string) {
    const q = (text ?? input).trim();
    if (!q || streaming) return;

    let convId = activeId;
    let isNew = false;

    if (!convId) {
      const conv: Conversation = { id: newId(), title: q.slice(0, 42), messages: [], createdAt: Date.now() };
      setConversations((prev) => [conv, ...prev]);
      convId = conv.id;
      setActiveId(convId);
      isNew = true;
    }

    const userMsg: Message = { role: "user", content: q, ts: Date.now() };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 || isNew ? q.slice(0, 42) : c.title,
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );
    setInput("");
    setStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/pesquisa-juridica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error ?? "Erro na pesquisa");
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreamingContent(full);
      }

      const assistantMsg: Message = { role: "assistant", content: full, ts: Date.now() };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        )
      );
      setStreamingContent("");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  const messages = activeConversation?.messages ?? [];
  const showWelcome = messages.length === 0 && !streamingContent;

  return (
    <div style={{
      display: "flex",
      height: "calc(100vh - 64px)",
      margin: "-2rem -2rem -2rem",
      overflow: "hidden",
      background: "oklch(0.09 0.018 264)",
      borderTop: "1px solid oklch(1 0 0 / 6%)",
    }}>

      {/* ── Left panel: conversation list ──────────────────────────────────── */}
      <div style={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid oklch(1 0 0 / 6%)",
        display: "flex",
        flexDirection: "column",
        background: "oklch(0.105 0.018 264)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 12px 12px", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 8v4l3 3"/>
            </svg>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "oklch(0.72 0.01 264)", letterSpacing: "0.04em" }}>
              LEXO IA
            </span>
          </div>
          <button
            onClick={newConversation}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 9,
              border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`,
              background: `color-mix(in oklab,${AC} 10%,oklch(0.145 0.02 264))`,
              color: AC,
              fontFamily: F,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova conversa
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {!hydrated ? null : conversations.length === 0 ? (
            <p style={{ fontFamily: F, fontSize: 12, color: "oklch(0.38 0.02 264)", textAlign: "center", padding: "24px 12px" }}>
              Nenhuma conversa ainda
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isActive
                      ? `color-mix(in oklab,${AC} 10%,oklch(0.155 0.02 264))`
                      : "transparent",
                    border: isActive ? `1px solid color-mix(in oklab,${AC} 18%,transparent)` : "1px solid transparent",
                    marginBottom: 2,
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={isActive ? AC : "oklch(0.40 0.02 264)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span style={{
                    fontFamily: F,
                    fontSize: 12,
                    color: isActive ? "oklch(0.90 0.01 264)" : "oklch(0.58 0.02 264)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}>
                    {conv.title || "Conversa sem título"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 2,
                      color: "oklch(0.38 0.02 264)", borderRadius: 4, flexShrink: 0,
                      display: "flex", alignItems: "center",
                      opacity: 0,
                    }}
                    className="conv-delete"
                  >
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Center: chat area ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {showWelcome ? (
            /* Welcome screen */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 24px" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg, color-mix(in oklab,${AC} 22%,oklch(0.16 0.02 264)), color-mix(in oklab,${AC2} 16%,oklch(0.14 0.02 264)))`,
                border: `1px solid color-mix(in oklab,${AC} 28%,transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                boxShadow: `0 8px 28px color-mix(in oklab,${AC} 18%,transparent)`,
              }}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={AC} />
                      <stop offset="100%" stopColor={AC2} />
                    </linearGradient>
                  </defs>
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="url(#sparkle-grad)"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", color: "oklch(0.94 0.008 264)", margin: "0 0 8px" }}>
                Lexo IA
              </h2>
              <p style={{ fontFamily: F, fontSize: 14, color: "oklch(0.55 0.02 264)", lineHeight: 1.65, maxWidth: 380, margin: "0 0 28px" }}>
                Seu assistente jurídico inteligente. Pesquise jurisprudência, redija peças processuais e obtenha análises do seu acervo.
              </p>
              {/* Suggestion chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {CHIPS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => setInput(prompt)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 99,
                      border: "1px solid oklch(1 0 0 / 10%)",
                      background: "oklch(0.145 0.02 264)",
                      fontFamily: F,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "oklch(0.75 0.01 264)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "user" ? (
                  <div style={{
                    maxWidth: "72%",
                    background: `linear-gradient(135deg, color-mix(in oklab,${AC} 20%,oklch(0.16 0.02 264)), color-mix(in oklab,${AC2} 14%,oklch(0.14 0.02 264)))`,
                    border: `1px solid color-mix(in oklab,${AC} 22%,transparent)`,
                    borderRadius: "16px 16px 4px 16px",
                    padding: "10px 16px",
                    fontFamily: F,
                    fontSize: 14,
                    color: "oklch(0.94 0.008 264)",
                    lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  <div style={{ maxWidth: "88%", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* AI avatar */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: `linear-gradient(135deg, color-mix(in oklab,${AC} 20%,oklch(0.16 0.02 264)), color-mix(in oklab,${AC2} 14%,oklch(0.14 0.02 264)))`,
                      border: `1px solid color-mix(in oklab,${AC} 22%,transparent)`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                      </svg>
                    </div>
                    <div style={{
                      background: "oklch(0.145 0.02 264)",
                      border: "1px solid oklch(1 0 0 / 8%)",
                      borderRadius: "4px 16px 16px 16px",
                      padding: "12px 16px",
                    }}>
                      <MarkdownText text={msg.content} />
                    </div>
                  </div>
                )}
                <Timestamp ts={msg.ts} />
              </div>
            ))
          )}

          {/* Streaming response */}
          {streaming && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                background: `linear-gradient(135deg, color-mix(in oklab,${AC} 20%,oklch(0.16 0.02 264)), color-mix(in oklab,${AC2} 14%,oklch(0.14 0.02 264)))`,
                border: `1px solid color-mix(in oklab,${AC} 22%,transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
                </svg>
              </div>
              <div style={{
                background: "oklch(0.145 0.02 264)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: "4px 16px 16px 16px",
                padding: "12px 16px",
                maxWidth: "88%",
                flex: 1,
              }}>
                {streamingContent ? (
                  <MarkdownText text={streamingContent} />
                ) : (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: AC,
                        animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                      }} />
                    ))}
                  </div>
                )}
                {streamingContent && (
                  <span style={{ display: "inline-block", width: 2, height: 14, background: AC, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-start infinite" }} />
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          borderTop: "1px solid oklch(1 0 0 / 6%)",
          padding: "16px 24px 20px",
          background: "oklch(0.105 0.018 264)",
        }}>
          {/* Chips (when chat active) */}
          {!showWelcome && !streaming && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
              {CHIPS.map(({ label, prompt }) => (
                <button
                  key={label}
                  onClick={() => setInput(prompt)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid oklch(1 0 0 / 8%)",
                    background: "oklch(0.145 0.02 264)",
                    fontFamily: F,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "oklch(0.60 0.02 264)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{
              flex: 1,
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 14,
              padding: "10px 14px",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Faça uma pergunta jurídica… (Ctrl+Enter para enviar)"
                disabled={streaming}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: F,
                  fontSize: 14,
                  color: "oklch(0.88 0.01 264)",
                  resize: "none",
                  lineHeight: 1.55,
                  maxHeight: 140,
                  overflow: "hidden",
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: "none",
                background: input.trim() && !streaming
                  ? `linear-gradient(135deg,${AC},${AC2})`
                  : "oklch(0.20 0.02 264)",
                cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
                boxShadow: input.trim() && !streaming ? `0 4px 16px color-mix(in oklab,${AC} 36%,transparent)` : "none",
                opacity: input.trim() && !streaming ? 1 : 0.45,
              }}
            >
              {streaming ? (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0.02 264)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p style={{ fontFamily: F, fontSize: 11, color: "oklch(0.36 0.02 264)", textAlign: "center", marginTop: 8 }}>
            Lexo IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>

      {/* ── Right panel: context ────────────────────────────────────────────── */}
      <div style={{
        width: 256,
        flexShrink: 0,
        borderLeft: "1px solid oklch(1 0 0 / 6%)",
        display: "flex",
        flexDirection: "column",
        background: "oklch(0.105 0.018 264)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
          <p style={{ fontFamily: F, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "oklch(0.48 0.02 264)", marginBottom: 0 }}>
            CONTEXTO DA IA
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* Sources */}
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "oklch(0.55 0.02 264)", marginBottom: 10 }}>
            Fontes consultadas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            {CONTEXT_SOURCES.map(({ label, active }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: active ? AC : "oklch(0.30 0.02 264)",
                  boxShadow: active ? `0 0 6px color-mix(in oklab,${AC} 70%,transparent)` : "none",
                }} />
                <span style={{
                  fontFamily: F, fontSize: 12,
                  color: active ? "oklch(0.78 0.01 264)" : "oklch(0.38 0.02 264)",
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* User info */}
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "oklch(0.55 0.02 264)", marginBottom: 10 }}>
            Sessão
          </p>
          <div style={{
            background: "oklch(0.145 0.02 264)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: 10,
            padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: `color-mix(in oklab,${AC} 14%,oklch(0.20 0.02 264))`,
                border: `1px solid color-mix(in oklab,${AC} 22%,transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontSize: 10, fontWeight: 700,
                color: AC, textTransform: "uppercase",
                flexShrink: 0,
              }}>
                {userEmail?.[0] ?? "U"}
              </div>
              <span style={{ fontFamily: FM, fontSize: 11, color: "oklch(0.58 0.02 264)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userEmail ?? "advogado@escritorio.com"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(0.72 0.18 142)", flexShrink: 0 }} />
              <span style={{ fontFamily: F, fontSize: 11, color: "oklch(0.52 0.02 264)" }}>
                Gemini — free tier ativo
              </span>
            </div>
          </div>

          {/* Stats */}
          {conversations.length > 0 && (
            <>
              <p style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "oklch(0.55 0.02 264)", margin: "20px 0 10px" }}>
                Histórico
              </p>
              <div style={{
                background: "oklch(0.145 0.02 264)",
                border: "1px solid oklch(1 0 0 / 7%)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}>
                <div>
                  <p style={{ fontFamily: FM, fontSize: 16, fontWeight: 700, color: "oklch(0.90 0.01 264)", margin: 0 }}>
                    {conversations.length}
                  </p>
                  <p style={{ fontFamily: F, fontSize: 10, color: "oklch(0.48 0.02 264)", margin: "2px 0 0" }}>conversas</p>
                </div>
                <div>
                  <p style={{ fontFamily: FM, fontSize: 16, fontWeight: 700, color: "oklch(0.90 0.01 264)", margin: 0 }}>
                    {conversations.reduce((s, c) => s + Math.floor(c.messages.length / 2), 0)}
                  </p>
                  <p style={{ fontFamily: F, fontSize: 10, color: "oklch(0.48 0.02 264)", margin: "2px 0 0" }}>perguntas</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .conv-delete { opacity: 0 !important; transition: opacity 0.15s; }
        div:hover > .conv-delete { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
