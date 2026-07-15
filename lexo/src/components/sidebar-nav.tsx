"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarClock,
  Wallet,
  Sparkles,
  BarChart2,
  Timer,
  CheckSquare,
  Activity,
  Globe,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  novo?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    items: [
      { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/processos",  label: "Processos",  icon: Briefcase,       roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/clientes",   label: "Clientes",   icon: Users,           roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/agenda",     label: "Agenda",     icon: CalendarClock,   roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/financeiro", label: "Financeiro", icon: Wallet,          roles: ["ADMIN", "ADVOGADO"] },
    ],
  },
  {
    label: "IA & INTELIGÊNCIA",
    items: [
      { href: "/pesquisa-juridica", label: "Lexo IA",    icon: Sparkles,  roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/jurimetria",        label: "Jurimetria", icon: BarChart2, roles: ["ADMIN", "ADVOGADO"] },
    ],
  },
  {
    label: "PRODUTIVIDADE",
    items: [
      { href: "/timesheet",  label: "Timesheet",  icon: Timer,        roles: ["ADMIN", "ADVOGADO"] },
      { href: "/tarefas",    label: "Tarefas",    icon: CheckSquare,  roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
      { href: "/andamentos", label: "Andamentos", icon: Activity,     roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
    ],
  },
  {
    label: "RELACIONAMENTO",
    items: [
      { href: "/portal-cliente", label: "Portal Cliente", icon: Globe, roles: ["ADMIN", "ADVOGADO"] },
    ],
  },
  {
    items: [
      { href: "/planos",          label: "Planos",        icon: CreditCard, roles: ["ADMIN"] },
      { href: "/configuracoes",   label: "Configurações", icon: Settings,   roles: ["ADMIN", "ADVOGADO", "SECRETARIA"] },
    ],
  },
];

export function SidebarNav({ role }: { role?: string }) {
  const pathname = usePathname();
  let itemIndex = 0;

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((group, gi) => {
        const visible = group.items.filter((l) => !role || l.roles.includes(role));
        if (visible.length === 0) return null;

        return (
          <div key={gi} className={cn(gi > 0 && "border-border/60 mt-4 border-t pt-4")}>
            {group.label && (
              <p className="mb-2 px-3 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/50 select-none">
                {group.label}
              </p>
            )}

            <div className="flex flex-col gap-1">
              {visible.map(({ href, label, icon: Icon, novo }) => {
                const active =
                  pathname === href ||
                  pathname.startsWith(href + "/") ||
                  pathname.startsWith(href + "?");
                const delay = `${itemIndex++ * 35}ms`;

                return (
                  <Link
                    key={href}
                    href={href}
                    style={{ "--delay": delay } as React.CSSProperties}
                    className={cn(
                      "animate-fade-in flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                      active
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active ? "text-brand-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {novo && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wide",
                          active
                            ? "border-brand-foreground/25 bg-brand-foreground/10 text-brand-foreground"
                            : "text-brand border-brand/20 bg-brand/8"
                        )}
                      >
                        NOVO
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
