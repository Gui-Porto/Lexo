import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { formatDate, formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/agenda/risk-badge";
import { Briefcase, Clock, Wallet, Users, ArrowRight, AlertCircle } from "lucide-react";

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
  ]);

  const totalAberto = Number(faturasSoma._sum.amount ?? 0);
  const orgName = session.user.name ?? "Advogado";

  const kpis = [
    {
      label: "Processos ativos",
      value: processosAtivos,
      icon: Briefcase,
      color: "oklch(0.66 0.18 274)",   // indigo
      bg: "oklch(0.66 0.18 274 / 0.12)",
      delay: "0ms",
    },
    {
      label: "Prazos em 7 dias",
      value: prazos7dias,
      icon: prazos7dias > 0 ? AlertCircle : Clock,
      color: prazos7dias > 0 ? "oklch(0.78 0.17 75)" : "oklch(0.65 0.15 200)",
      bg: prazos7dias > 0 ? "oklch(0.78 0.17 75 / 0.12)" : "oklch(0.65 0.15 200 / 0.10)",
      delay: "60ms",
    },
    {
      label: "Faturas em aberto",
      value: formatCurrency(totalAberto),
      icon: Wallet,
      color: "oklch(0.72 0.17 150)",   // emerald
      bg: "oklch(0.72 0.17 150 / 0.10)",
      delay: "120ms",
    },
    {
      label: "Clientes",
      value: totalClientes,
      icon: Users,
      color: "oklch(0.70 0.18 300)",   // violet
      bg: "oklch(0.70 0.18 300 / 0.12)",
      delay: "180ms",
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
            className="hover-glow animate-fade-up rounded-xl p-5 relative overflow-hidden"
            style={{
              "--delay": delay,
              background: "oklch(0.155 0.02 264)",
              border: "1px solid oklch(1 0 0 / 7%)",
            } as React.CSSProperties}
          >
            {/* Glow blob */}
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
                <p
                  className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight"
                  style={{ color }}
                >
                  {value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards inferiores */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos prazos */}
        <div
          className="animate-fade-up rounded-xl"
          style={{
            "--delay": "240ms",
            background: "oklch(0.155 0.02 264)",
            border: "1px solid oklch(1 0 0 / 7%)",
          } as React.CSSProperties}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "oklch(1 0 0 / 7%)" }}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Próximos prazos</span>
            </div>
            <Link
              href="/agenda"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {proximosPrazos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum prazo pendente.</p>
            ) : (
              <ul className="space-y-3">
                {proximosPrazos.map((d, i) => (
                  <li
                    key={d.id}
                    className="animate-fade-in flex items-center justify-between gap-3 py-1"
                    style={{ "--delay": `${280 + i * 50}ms` } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            d.type === "AUDIENCIA"
                              ? "oklch(0.70 0.18 30)"
                              : "oklch(0.66 0.18 274)",
                          boxShadow: `0 0 6px ${d.type === "AUDIENCIA" ? "oklch(0.70 0.18 30 / 0.7)" : "oklch(0.66 0.18 274 / 0.7)"}`,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.case.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RiskBadge date={d.date} type={d.type} status={d.status} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.date)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Processos recentes */}
        <div
          className="animate-fade-up rounded-xl"
          style={{
            "--delay": "280ms",
            background: "oklch(0.155 0.02 264)",
            border: "1px solid oklch(1 0 0 / 7%)",
          } as React.CSSProperties}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "oklch(1 0 0 / 7%)" }}>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Processos recentes</span>
            </div>
            <Link
              href="/processos"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="px-6 py-4">
            {processosRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum processo cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {processosRecentes.map((c, i) => (
                  <li
                    key={c.id}
                    className="animate-fade-in flex items-center justify-between gap-3 py-1"
                    style={{ "--delay": `${320 + i * 50}ms` } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: "oklch(0.66 0.18 274)",
                          boxShadow: "0 0 6px oklch(0.66 0.18 274 / 0.7)",
                        }}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/processos/${c.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors truncate block"
                        >
                          {c.number}
                        </Link>
                        <p className="text-xs text-muted-foreground">{c.client.name}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs shrink-0"
                      style={
                        c.status === "ATIVO"
                          ? { background: "oklch(0.72 0.17 150 / 0.15)", color: "oklch(0.80 0.14 150)", border: "1px solid oklch(0.72 0.17 150 / 0.25)" }
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
