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
    <nav className="flex flex-col gap-4">
      {NAV.map((group, gi) => {
        const visible = group.items.filter((l) => !role || l.roles.includes(role));
        if (visible.length === 0) return null;

        return (
          <div key={gi}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/55 select-none">
                {group.label}
              </p>
            )}

            <div className="flex flex-col gap-0.5">
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
                    style={
                      {
                        "--delay": delay,
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
                    <span className="flex-1 truncate">{label}</span>
                    {novo ? (
                      <span className="text-brand border-brand/20 bg-brand/8 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                        NOVO
                      </span>
                    ) : active ? (
                      <span className="bg-brand ml-auto h-1.5 w-1.5 shrink-0 rounded-full" />
                    ) : null}
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
