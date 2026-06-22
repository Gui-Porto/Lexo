import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { formatDate, formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/agenda/risk-badge";
import {
  Briefcase, Clock, Wallet, Users, ArrowRight,
  AlertCircle, Sparkles, ChevronRight,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);

  const [
    processosAtivos,
    prazos7dias,
    faturasSoma,
    totalClientes,
    proximosPrazos,
    processosRecentes,
    porArea,
  ] = await Promise.all([
    db.case.count({ where: { organizationId: orgId, status: "ATIVO" } }),
    db.deadline.count({
      where: { organizationId: orgId, status: "PENDENTE", date: { gte: now, lte: in7days } },
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: { in: ["PENDENTE", "ATRASADO"] } },
      _sum: { amount: true },
    }),
    db.client.count({ where: { organizationId: orgId } }),
    db.deadline.findMany({
      where: { organizationId: orgId, status: "PENDENTE", date: { gte: now } },
      include: { case: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.case.findMany({
      where: { organizationId: orgId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.case.groupBy({
      by: ["area"],
      where: { organizationId: orgId, status: "ATIVO" },
      _count: { _all: true },
      orderBy: { _count: { area: "desc" } },
      take: 5,
    }),
  ]);

  const totalAberto = Number(faturasSoma._sum.amount ?? 0);
  const orgName = session.user.name ?? "Advogado";
  const totalPorArea = porArea.reduce((s, r) => s + r._count._all, 0);

  const areaColors = [
    "#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706",
  ];

  const kpis = [
    {
      label: "Processos ativos",
      value: processosAtivos,
      icon: Briefcase,
      color: "#2563eb",
      bg: "rgb(37 99 235 / 0.10)",
      delay: "0ms",
    },
    {
      label: "Prazos em 7 dias",
      value: prazos7dias,
      icon: prazos7dias > 0 ? AlertCircle : Clock,
      color: prazos7dias > 0 ? "#d97706" : "#0891b2",
      bg: prazos7dias > 0 ? "rgb(217 119 6 / 0.10)" : "rgb(8 145 178 / 0.10)",
      delay: "60ms",
    },
    {
      label: "Faturas em aberto",
      value: formatCurrency(totalAberto),
      icon: Wallet,
      color: "#059669",
      bg: "rgb(5 150 105 / 0.10)",
      delay: "120ms",
    },
    {
      label: "Clientes",
      value: totalClientes,
      icon: Users,
      color: "#7c3aed",
      bg: "rgb(124 58 237 / 0.10)",
      delay: "180ms",
    },
  ];

  const iaSugestoes = [
    {
      label: "Analisar processos com prazo crítico",
      desc: `${prazos7dias} prazo${prazos7dias !== 1 ? "s" : ""} nos próximos 7 dias`,
      href: "/agenda",
      color: "#d97706",
    },
    {
      label: "Consultar andamentos pendentes",
      desc: "Verifique publicações recentes nos tribunais",
      href: "/pesquisa-juridica",
      color: "#2563eb",
    },
    {
      label: "Revisar faturas em atraso",
      desc: formatCurrency(totalAberto) + " em aberto",
      href: "/financeiro",
      color: "#059669",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-up space-y-1">
        <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">{orgName}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, delay }) => (
          <div
            key={label}
            className="hover-glow animate-fade-up bg-card border-border shadow-panel relative overflow-hidden rounded-xl border p-5"
            style={{ "--delay": delay } as React.CSSProperties}
          >
            <div
              className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full blur-2xl"
              style={{ background: bg }}
              aria-hidden
            />
            <div className="relative space-y-3">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: bg, border: `1px solid ${color}30` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight" style={{ color }}>
                  {value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Linha do meio: Lexo IA sugere + Processos por área */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lexo IA sugere */}
        <div
          className="animate-fade-up bg-card border-border shadow-panel rounded-xl border overflow-hidden"
          style={{ "--delay": "220ms" } as React.CSSProperties}
        >
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand/10 border-brand/20 flex h-6 w-6 items-center justify-center rounded-md border">
                <Sparkles className="text-brand h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">A Lexo IA sugere</span>
            </div>
            <Link
              href="/pesquisa-juridica"
              className="hover:text-brand flex items-center gap-1 text-xs text-muted-foreground transition-colors"
            >
              Abrir IA <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-border divide-y">
            {iaSugestoes.map(({ label, desc, href, color }, i) => (
              <Link
                key={label}
                href={href}
                className="animate-fade-in hover:bg-secondary/40 flex items-center gap-4 px-6 py-3.5 transition-colors"
                style={{ "--delay": `${260 + i * 50}ms` } as React.CSSProperties}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
        </div>

        {/* Processos por área */}
        <div
          className="animate-fade-up bg-card border-border shadow-panel rounded-xl border"
          style={{ "--delay": "260ms" } as React.CSSProperties}
        >
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="text-brand h-4 w-4" />
              <span className="text-sm font-medium">Processos por área</span>
            </div>
            <Link
              href="/processos"
              className="hover:text-brand flex items-center gap-1 text-xs text-muted-foreground transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {porArea.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum processo cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {porArea.map((row, i) => {
                  const area = row.area ?? "Sem área";
                  const pct = totalPorArea > 0 ? Math.round((row._count._all / totalPorArea) * 100) : 0;
                  const color = areaColors[i % areaColors.length];
                  return (
                    <div
                      key={area}
                      className="animate-fade-in space-y-1"
                      style={{ "--delay": `${300 + i * 45}ms` } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{area}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {row._count._all} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linha inferior: Próximos prazos + Processos recentes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos prazos */}
        <div
          className="animate-fade-up bg-card border-border shadow-panel rounded-xl border"
          style={{ "--delay": "300ms" } as React.CSSProperties}
        >
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="text-brand h-4 w-4" />
              <span className="text-sm font-medium">Próximos prazos</span>
            </div>
            <Link
              href="/agenda"
              className="hover:text-brand flex items-center gap-1 text-xs text-muted-foreground transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {proximosPrazos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum prazo pendente.</p>
            ) : (
              <ul className="space-y-3">
                {proximosPrazos.map((d, i) => (
                  <li
                    key={d.id}
                    className="animate-fade-in flex items-center justify-between gap-3 py-1"
                    style={{ "--delay": `${340 + i * 50}ms` } as React.CSSProperties}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: d.type === "AUDIENCIA" ? "#e11d48" : "#2563eb" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.case.number}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RiskBadge date={d.date} type={d.type} status={d.status} />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(d.date)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Processos recentes */}
        <div
          className="animate-fade-up bg-card border-border shadow-panel rounded-xl border"
          style={{ "--delay": "340ms" } as React.CSSProperties}
        >
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Briefcase className="text-brand h-4 w-4" />
              <span className="text-sm font-medium">Processos recentes</span>
            </div>
            <Link
              href="/processos"
              className="hover:text-brand flex items-center gap-1 text-xs text-muted-foreground transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {processosRecentes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum processo cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {processosRecentes.map((c, i) => (
                  <li
                    key={c.id}
                    className="animate-fade-in flex items-center justify-between gap-3 py-1"
                    style={{ "--delay": `${380 + i * 50}ms` } as React.CSSProperties}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#2563eb" }} />
                      <div className="min-w-0">
                        <Link
                          href={`/processos/${c.id}`}
                          className="hover:text-brand block truncate text-sm font-medium transition-colors"
                        >
                          {c.number}
                        </Link>
                        <p className="text-xs text-muted-foreground">{c.client.name}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs"
                      style={
                        c.status === "ATIVO"
                          ? { background: "rgb(52 211 153 / 0.12)", color: "#6ee7b7", border: "1px solid rgb(52 211 153 / 0.25)" }
                          : {}
                      }
                    >
                      {c.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
