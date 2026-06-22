"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarClock,
  Wallet,
  UserCog,
  CreditCard,
  Shield,
  ClipboardList,
  ScaleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_LINKS = [
  { href: "/dashboard",              label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/processos",              label: "Processos",  icon: Briefcase,       roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/clientes",               label: "Clientes",   icon: Users,           roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/agenda",                 label: "Agenda",     icon: CalendarClock,   roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/financeiro",             label: "Financeiro",  icon: Wallet,          roles: ["ADMIN", "ADVOGADO"] },
  { href: "/pesquisa-juridica",      label: "Pesquisa IA", icon: ScaleIcon,       roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/configuracoes/usuarios", label: "Usuários",    icon: UserCog,         roles: ["ADMIN"] },
  { href: "/planos",                 label: "Planos",     icon: CreditCard,      roles: ["ADMIN"] },
  { href: "/configuracoes/seguranca",label: "Segurança",  icon: Shield,          roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/configuracoes/auditoria",label: "Auditoria",  icon: ClipboardList,   roles: ["ADMIN"] },
];

export function SidebarNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const links = BASE_LINKS.filter((l) => !role || l.roles.includes(role));

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label, icon: Icon }, i) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={
              {
                "--delay": `${i * 40}ms`,
                ...(active ? { boxShadow: "inset 2px 0 0 var(--brand)" } : {}),
              } as React.CSSProperties
            }
            className={cn(
              "animate-fade-in group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-all duration-200",
                active
                  ? "text-brand"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {label}
            {active && (
              <span className="bg-brand ml-auto h-1.5 w-1.5 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
