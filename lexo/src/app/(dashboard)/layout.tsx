import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FlashToast } from "@/components/flash-toast";
import { TrialBanner } from "@/components/trial-banner";
import { AppShell } from "@/components/app-shell";

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
    <AppShell
      role={session.user.role}
      initials={initials}
      name={session.user.name ?? session.user.email ?? "Usuário"}
      roleLabel={roleLabel}
    >
      <Suspense>
        <FlashToast />
      </Suspense>
      <Suspense>
        <TrialBanner organizationId={session.user.organizationId} />
      </Suspense>
      {children}
    </AppShell>
  );
}
