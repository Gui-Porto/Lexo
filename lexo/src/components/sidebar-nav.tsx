"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BASE_LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/processos", label: "Processos", roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/clientes", label: "Clientes", roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/agenda", label: "Agenda", roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/financeiro", label: "Financeiro", roles: ["ADMIN", "ADVOGADO"] },
  { href: "/configuracoes/usuarios", label: "Usuários", roles: ["ADMIN"] },
];

export function SidebarNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const links = BASE_LINKS.filter((l) => !role || l.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
