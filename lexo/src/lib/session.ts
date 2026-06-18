import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }
  return session!;
}

// 🔒 SEGURANÇA [VULN-2]: autorização no PONTO DE USO, não só no proxy/middleware.
// O redirecionamento por role no proxy só protege navegação de página; Server Actions
// e API routes são invocáveis diretamente e DEVEM revalidar a role aqui (CWE-285, A1).
type Role = "ADMIN" | "ADVOGADO" | "SECRETARIA";

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role as Role)) {
    redirect("/dashboard");
  }
  return session;
}

// Financeiro é vedado à SECRETARIA (espelha a regra do proxy em auth.config.ts).
export async function requireFinanceiroAccess() {
  return requireRole(["ADMIN", "ADVOGADO"]);
}
