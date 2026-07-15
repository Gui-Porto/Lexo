"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Bell, Sparkles, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoWordmark } from "@/components/ui/logo";
import { CommandPalette } from "@/components/command-palette";
import { logout } from "@/actions/logout";

const AC = "#cef79e";

function SidebarInner({
  role,
  initials,
  name,
  roleLabel,
  onNavigate,
}: {
  role?: string;
  initials: string;
  name: string;
  roleLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 10px 18px" }}>
        <LogoWordmark size={32} />
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            color: "#93a09f",
            border: "1px solid #4d5757",
            borderRadius: 6,
            padding: "2px 6px",
          }}
        >
          PRO
        </span>
      </div>

      {/* Nav — fecha o drawer ao clicar num link no mobile */}
      <div className="flex-1 overflow-y-auto" onClick={onNavigate}>
        <SidebarNav role={role} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 10px",
          borderTop: "1px solid #4d5757",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#2c3b3c",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontFamily: "'Geist', sans-serif",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "'Geist', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: "'Geist', sans-serif",
              fontSize: 11,
              color: "#93a09f",
            }}
          >
            {roleLabel}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Sair"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#93a09f",
              display: "flex",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </>
  );
}

export function AppShell({
  role,
  initials,
  name,
  roleLabel,
  children,
}: {
  role?: string;
  initials: string;
  name: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-screen relative">
      {/* Luz ambiente sutil */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, color-mix(in oklab, #cef79e 10%, transparent), transparent 70%)",
        }}
      />

      {/* Sidebar — desktop (sticky) */}
      <aside
        className="relative z-10 hidden md:flex shrink-0 flex-col min-h-screen"
        style={{
          width: 248,
          background: "#1a2425",
          borderRight: "1px solid #4d5757",
          padding: "18px 14px",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <SidebarInner role={role} initials={initials} name={name} roleLabel={roleLabel} />
      </aside>

      {/* Sidebar — mobile (drawer) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={close}
          aria-hidden
          style={{
            background: "oklch(0 0 0 / 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}
      <aside
        className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: 264,
          maxWidth: "82vw",
          background: "#1a2425",
          borderRight: "1px solid #4d5757",
          padding: "18px 14px",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <button
          onClick={close}
          aria-label="Fechar menu"
          style={{
            position: "absolute",
            top: 16,
            right: 12,
            background: "transparent",
            border: "none",
            color: "#93a09f",
            cursor: "pointer",
            display: "flex",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>
        <SidebarInner
          role={role}
          initials={initials}
          name={name}
          roleLabel={roleLabel}
          onNavigate={close}
        />
      </aside>

      {/* Coluna principal */}
      <main
        className="relative z-10 flex-1"
        style={{ display: "flex", flexDirection: "column", height: "100vh", minWidth: 0 }}
      >
        {/* Topbar */}
        <div
          className="px-4 md:px-6"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: 14,
            paddingBottom: 14,
            borderBottom: "1px solid #4d5757",
            background: "#222f30b3",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          {/* Hamburger — só mobile */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="md:hidden"
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 10,
              border: "1px solid #4d5757",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#93a09f",
              background: "#222f30",
              cursor: "pointer",
            }}
          >
            <Menu size={18} />
          </button>

          {/* Busca → Command Palette */}
          <CommandPalette />

          {/* Ações à direita */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/pesquisa-juridica"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid color-mix(in oklab, ${AC} 32%, transparent)`,
                background: `color-mix(in oklab, ${AC} 14%, transparent)`,
                color: "#ffffff",
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                padding: "8px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">Perguntar à Lexo IA</span>
            </Link>

            <div style={{ position: "relative" }}>
              <button
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid #4d5757",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#93a09f",
                  background: "#222f30",
                  cursor: "pointer",
                }}
              >
                <Bell size={17} />
              </button>
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 9,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--destructive)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-4 md:p-7" style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
