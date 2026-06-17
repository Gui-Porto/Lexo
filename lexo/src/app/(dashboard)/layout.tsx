import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/logout";
import { FlashToast } from "@/components/flash-toast";
import { LogOut } from "lucide-react";
import { LogoWordmark } from "@/components/ui/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen relative">
      {/* Luz ambiente no fundo */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.66 0.18 274 / 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 80% 80%, oklch(0.65 0.15 200 / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Sidebar */}
      <aside
        className="relative z-10 flex w-64 shrink-0 flex-col border-r"
        style={{
          background: "oklch(0.09 0.016 264 / 0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderColor: "oklch(1 0 0 / 6%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center px-5 py-5 border-b" style={{ borderColor: "oklch(1 0 0 / 6%)" }}>
          <LogoWordmark size={34} />
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav role={session.user.role} />
        </div>

        {/* Footer */}
        <div
          className="px-4 py-4 border-t space-y-3"
          style={{ borderColor: "oklch(1 0 0 / 6%)" }}
        >
          <div className="flex items-center gap-2 px-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase"
              style={{
                background: "linear-gradient(135deg, oklch(0.66 0.18 274 / 0.3), oklch(0.55 0.2 290 / 0.3))",
                border: "1px solid oklch(0.66 0.18 274 / 0.3)",
                color: "oklch(0.80 0.12 274)",
              }}
            >
              {session.user.name?.[0] ?? session.user.email?.[0] ?? "U"}
            </div>
            <p className="truncate text-xs text-muted-foreground flex-1">
              {session.user.email}
            </p>
          </div>
          <form action={logout}>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-muted-foreground hover:text-foreground transition-colors"
              type="submit"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Suspense>
            <FlashToast />
          </Suspense>
          {children}
        </div>
      </main>
    </div>
  );
}
