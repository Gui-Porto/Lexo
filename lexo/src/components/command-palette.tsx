"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AC = "oklch(0.66 0.18 274)";
const F = "'Geist', sans-serif";
const FM = "'Geist Mono', monospace";

type Action = {
  id: string;
  label: string;
  sublabel?: string;
  category: string;
  href: string;
  icon: React.ReactNode;
};

function Icon({ d, size = 16 }: { d: string | string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const ACTIONS: Action[] = [
  // NAVEGAR
  { id: "dashboard",   label: "Dashboard",        category: "NAVEGAR",       href: "/dashboard",             icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { id: "processos",   label: "Processos",         category: "NAVEGAR",       href: "/processos",             icon: <Icon d={["M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", "M14 2v6h6"]} /> },
  { id: "clientes",    label: "Clientes",          category: "NAVEGAR",       href: "/clientes",              icon: <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} /> },
  { id: "agenda",      label: "Agenda",            category: "NAVEGAR",       href: "/agenda",                icon: <Icon d={["M8 2v4", "M16 2v4", "M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"]} /> },
  { id: "financeiro",  label: "Financeiro",        category: "NAVEGAR",       href: "/financeiro",            icon: <Icon d={["M21 12V7H5a2 2 0 0 1 0-4h14v4", "M3 5v14a2 2 0 0 0 2 2h16v-5", "M18 12a2 2 0 0 0 0 4h4v-4Z"]} /> },
  { id: "andamentos",  label: "Andamentos",        category: "PRODUTIVIDADE", href: "/andamentos",            icon: <Icon d={["M22 12h-4l-3 9L9 3l-3 9H2"]} /> },
  { id: "timesheet",   label: "Timesheet",         category: "PRODUTIVIDADE", href: "/timesheet",             icon: <Icon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"]} /> },
  { id: "tarefas",     label: "Tarefas",           category: "PRODUTIVIDADE", href: "/tarefas",               icon: <Icon d={["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} /> },
  { id: "portal",      label: "Portal Cliente",    category: "PRODUTIVIDADE", href: "/portal-cliente",        icon: <Icon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"]} /> },
  { id: "lexo-ia",     label: "Lexo IA",           sublabel: "Pesquisa jurídica em linguagem natural", category: "IA & INTELIGÊNCIA", href: "/pesquisa-juridica", icon: <Icon d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z" /> },
  { id: "jurimetria",  label: "Jurimetria",        sublabel: "Análise preditiva de processos", category: "IA & INTELIGÊNCIA",     href: "/jurimetria",            icon: <Icon d={["M3 17l6-6 4 4 8-8", "M14 7h7v7"]} /> },
  // CRIAR
  { id: "novo-processo", label: "Novo processo",  sublabel: "Abrir cadastro", category: "CRIAR",             href: "/processos/novo",        icon: <Icon d={["M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", "M14 2v6h6", "M12 13v6", "M9 16h6"]} /> },
  { id: "novo-cliente",  label: "Novo cliente",   sublabel: "Abrir cadastro", category: "CRIAR",             href: "/clientes/novo",         icon: <Icon d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M16 11h6m-3-3v6"]} /> },
  { id: "novo-prazo",    label: "Novo prazo",     sublabel: "Agendar prazo",  category: "CRIAR",             href: "/agenda/novo",           icon: <Icon d={["M8 2v4", "M16 2v4", "M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M12 14v4", "M10 16h4"]} /> },
  { id: "nova-fatura",   label: "Nova fatura",    sublabel: "Registrar cobrança", category: "CRIAR",         href: "/financeiro/novo",       icon: <Icon d={["M21 12V7H5a2 2 0 0 1 0-4h14v4", "M3 5v14a2 2 0 0 0 2 2h16v-5", "M18 12a2 2 0 0 0 0 4h4v-4Z", "M12 10v6", "M9 13h6"]} /> },
  // CONFIGURAÇÕES
  { id: "usuarios",    label: "Usuários",          category: "CONFIGURAÇÕES", href: "/configuracoes/usuarios", icon: <Icon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} /> },
  { id: "seguranca",   label: "Segurança & 2FA",   category: "CONFIGURAÇÕES", href: "/configuracoes/seguranca", icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { id: "auditoria",   label: "Auditoria",         category: "CONFIGURAÇÕES", href: "/configuracoes/auditoria", icon: <Icon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} /> },
];

const CATEGORY_ORDER = ["NAVEGAR", "CRIAR", "PRODUTIVIDADE", "IA & INTELIGÊNCIA", "CONFIGURAÇÕES"];

function groupActions(items: Action[]): { category: string; items: Action[] }[] {
  const map = new Map<string, Action[]>();
  for (const a of items) {
    if (!map.has(a.category)) map.set(a.category, []);
    map.get(a.category)!.push(a);
  }
  return CATEGORY_ORDER
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, items: map.get(c)! }));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = ACTIONS.filter(
    (a) =>
      query === "" ||
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.sublabel?.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = groupActions(filtered);

  const handleSelect = useCallback(
    (action: Action) => {
      router.push(action.href);
      setOpen(false);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[selected];
      if (action) handleSelect(action);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  // Reset selection when query changes
  useEffect(() => { setSelected(0); }, [query]);

  let globalIdx = 0;

  return (
    <>
      {/* Trigger — search bar */}
      <button
        onClick={() => setOpen(true)}
        style={{
          flex: 1,
          maxWidth: 420,
          height: 38,
          border: "1px solid oklch(1 0 0 / 9%)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          padding: "0 13px",
          gap: 9,
          background: "oklch(0.14 0.018 264)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="oklch(0.5 0.02 264)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.5 0.02 264)", flex: 1 }}>
          Buscar processo, cliente, prazo…
        </span>
        <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: "oklch(0.45 0.02 264)", border: "1px solid oklch(1 0 0 / 9%)", borderRadius: 5, padding: "1px 6px" }}>
          ⌘K
        </span>
      </button>

      {/* Dialog overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "oklch(0 0 0 / 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "14vh",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 580,
              borderRadius: 16,
              background: "oklch(0.13 0.018 264)",
              border: "1px solid oklch(1 0 0 / 10%)",
              boxShadow: "0 32px 80px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(1 0 0 / 4%)",
              overflow: "hidden",
            }}
          >
            {/* Input row */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar ação, página ou criar…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: F,
                  fontSize: 15,
                  color: "oklch(0.92 0.01 264)",
                  caretColor: AC,
                }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{ background: "oklch(0.18 0.02 264)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 6, padding: "2px 8px", fontFamily: FM, fontSize: 11, color: "oklch(0.5 0.02 264)", cursor: "pointer" }}
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} style={{ maxHeight: 380, overflowY: "auto", padding: "8px 0" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", fontFamily: F, fontSize: 14, color: "oklch(0.48 0.02 264)" }}>
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </div>
              ) : (
                grouped.map(({ category, items }) => (
                  <div key={category}>
                    <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: "oklch(0.45 0.02 264)", letterSpacing: "1px", padding: "10px 16px 5px" }}>
                      {category}
                    </div>
                    {items.map((action) => {
                      const idx = globalIdx++;
                      const isSelected = selected === idx;
                      return (
                        <button
                          key={action.id}
                          data-idx={idx}
                          onClick={() => handleSelect(action)}
                          onMouseEnter={() => setSelected(idx)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            padding: "9px 16px",
                            background: isSelected ? `color-mix(in oklab, ${AC} 12%, oklch(0.16 0.02 264))` : "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.1s",
                          }}
                        >
                          <span style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isSelected ? `color-mix(in oklab, ${AC} 20%, oklch(0.2 0.02 264))` : "oklch(0.18 0.02 264)",
                            border: isSelected ? `1px solid color-mix(in oklab, ${AC} 30%, transparent)` : "1px solid oklch(1 0 0 / 8%)",
                            color: isSelected ? AC : "oklch(0.6 0.02 264)",
                            transition: "all 0.1s",
                          }}>
                            {action.icon}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: isSelected ? "oklch(0.96 0.01 264)" : "oklch(0.82 0.01 264)" }}>
                              {action.label}
                            </div>
                            {action.sublabel && (
                              <div style={{ fontFamily: F, fontSize: 11, color: "oklch(0.50 0.02 264)", marginTop: 1 }}>
                                {action.sublabel}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M13 6l6 6-6 6"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid oklch(1 0 0 / 7%)", padding: "9px 16px", display: "flex", gap: 18, alignItems: "center" }}>
              {[["↑↓", "navegar"], ["↵", "abrir"], ["Esc", "fechar"]].map(([key, label]) => (
                <span key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, color: "oklch(0.45 0.02 264)" }}>
                  <span style={{ background: "oklch(0.18 0.02 264)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 4, padding: "1px 5px" }}>{key}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
