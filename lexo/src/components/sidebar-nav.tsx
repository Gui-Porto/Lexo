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
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_LINKS = [
  { href: "/dashboard",              label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/processos",              label: "Processos",  icon: Briefcase,       roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/clientes",               label: "Clientes",   icon: Users,           roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/agenda",                 label: "Agenda",     icon: CalendarClock,   roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
  { href: "/financeiro",             label: "Financeiro", icon: Wallet,          roles: ["ADMIN", "ADVOGADO"] },
  { href: "/configuracoes/usuarios", label: "Usuários",   icon: UserCog,         roles: ["ADMIN"] },
  { href: "/planos",                 label: "Planos",     icon: CreditCard,      roles: ["ADMIN"] },
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
            style={{ "--delay": `${i * 40}ms` } as React.CSSProperties}
            className={cn(
              "animate-fade-in group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            {...(active && {
              style: {
                background: "linear-gradient(90deg, oklch(0.66 0.18 274 / 0.2), oklch(0.66 0.18 274 / 0.08))",
                boxShadow: "inset 1px 0 0 oklch(0.66 0.18 274 / 0.8)",
                "--delay": `${i * 40}ms`,
              } as React.CSSProperties,
            })}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-all duration-200",
                active
                  ? "text-primary drop-shadow-[0_0_6px_oklch(0.66_0.18_274)]"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {label}
            {active && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full"
                style={{
                  background: "oklch(0.66 0.18 274)",
                  boxShadow: "0 0 8px 2px oklch(0.66 0.18 274 / 0.6)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
