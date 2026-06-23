import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { logout } from "@/actions/logout";
import { FlashToast } from "@/components/flash-toast";
import { TrialBanner } from "@/components/trial-banner";
import { LogOut, Bell, Search, Sparkles } from "lucide-react";
import { LogoWordmark } from "@/components/ui/logo";

const AC = "oklch(0.66 0.18 274)";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((s: string) => s[0])
    .join("")
    .toUpperCase();

  const roleLabel =
    session.user.role === "ADMIN"
      ? "Admin"
      : session.user.role === "ADVOGADO"
        ? "Advogado"
        : "Secretaria";

  return (
    <div className="flex min-h-screen relative">
      {/* Luz ambiente sutil */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, color-mix(in oklab, oklch(0.66 0.18 274) 10%, transparent), transparent 70%)",
        }}
      />

      {/* Sidebar */}
      <aside
        className="relative z-10 flex shrink-0 flex-col min-h-screen"
        style={{
          width: 248,
          background: "oklch(0.09 0.016 264)",
          borderRight: "1px solid oklch(1 0 0 / 6%)",
          padding: "18px 14px",
          gap: 3,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 10px 18px" }}>
          <LogoWordmark size={32} />
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              color: "oklch(0.55 0.02 264)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 6,
              padding: "2px 6px",
            }}
          >
            PRO
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={session.user.role} />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "12px 10px",
            borderTop: "1px solid oklch(1 0 0 / 6%)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `linear-gradient(135deg, oklch(0.4 0.05 274), oklch(0.3 0.04 300))`,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "oklch(0.9 0.01 264)",
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
                color: "oklch(0.92 0.008 264)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {session.user.name ?? session.user.email}
            </div>
            <div
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 11,
                color: "oklch(0.55 0.02 264)",
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
                color: "oklch(0.45 0.02 264)",
                display: "flex",
                padding: 4,
                borderRadius: 6,
              }}
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </aside>

      {/* Main column */}
      <main
        className="relative z-10 flex-1"
        style={{ display: "flex", flexDirection: "column", height: "100vh", minWidth: 0 }}
      >
        {/* Topbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 26px",
            borderBottom: "1px solid oklch(1 0 0 / 6%)",
            background: "oklch(0.12 0.018 264 / 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          {/* Search bar */}
          <div
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
            }}
          >
            <Search size={15} color="oklch(0.5 0.02 264)" />
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                color: "oklch(0.5 0.02 264)",
                flex: 1,
              }}
            >
              Buscar processo, cliente, prazo…
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                fontWeight: 500,
                color: "oklch(0.45 0.02 264)",
                border: "1px solid oklch(1 0 0 / 9%)",
                borderRadius: 5,
                padding: "1px 6px",
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/pesquisa-juridica"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid color-mix(in oklab, ${AC} 32%, transparent)`,
                background: `color-mix(in oklab, ${AC} 14%, transparent)`,
                color: "oklch(0.97 0.01 264)",
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                padding: "8px 14px",
                textDecoration: "none",
              }}
            >
              <Sparkles size={15} />
              Perguntar à Lexo IA
            </Link>

            <div style={{ position: "relative" }}>
              <button
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid oklch(1 0 0 / 9%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.6 0.02 264)",
                  background: "oklch(0.14 0.018 264)",
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
                  background: "oklch(0.7 0.18 30)",
                  boxShadow: "0 0 6px oklch(0.7 0.18 30)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px" }}>
          <Suspense>
            <FlashToast />
          </Suspense>
          <Suspense>
            <TrialBanner organizationId={session.user.organizationId} />
          </Suspense>
          {children}
        </div>
      </main>
    </div>
  );
}
