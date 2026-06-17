import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/logout";
import { FlashToast } from "@/components/flash-toast";

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
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-muted/30 p-4">
        <div className="mb-6 px-3">
          <span className="text-lg font-bold">Lexo</span>
        </div>
        <SidebarNav role={session.user.role} />
        <div className="mt-auto space-y-2 px-3">
          <p className="truncate text-sm text-muted-foreground">
            {session.user.email}
          </p>
          <form action={logout}>
            <Button variant="outline" size="sm" className="w-full" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Suspense>
          <FlashToast />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
