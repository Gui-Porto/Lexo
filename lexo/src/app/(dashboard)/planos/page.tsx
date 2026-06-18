import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { isPaidPlan, isTrialExpired, daysLeftInTrial, PLAN_LABELS } from "@/lib/billing";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

const PLANS = [
  {
    key: "essencial",
    label: "Essencial",
    price: "R$ 79",
    period: "/mês",
    description: "Para escritórios em crescimento",
    priceEnvKey: "STRIPE_PRICE_ESSENCIAL",
    features: [
      "Processos ilimitados",
      "Agenda e prazos",
      "Clientes e contratos",
      "Financeiro e relatórios",
      "Histórico de atividades",
      "Notificações de prazo por email",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "R$ 149",
    period: "/mês",
    description: "Para escritórios consolidados",
    priceEnvKey: "STRIPE_PRICE_PRO",
    highlight: true,
    features: [
      "Tudo do Essencial",
      "Usuários ilimitados",
      "Relatórios avançados",
      "Gerador de minutas com IA",
      "Extrator de documentos PDF",
      "Suporte prioritário",
    ],
  },
];

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { plan: true, trialEndsAt: true, stripeSubscriptionId: true, stripeCustomerId: true },
  });

  const currentPlan = org?.plan ?? "trial";
  const paid = isPaidPlan(currentPlan);
  const expired = isTrialExpired(currentPlan, org?.trialEndsAt ?? null);
  const daysLeft = daysLeftInTrial(org?.trialEndsAt ?? null);
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-8">
      <PageHeader icon={Zap} title="Planos" />

      {sp.success && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "oklch(0.35 0.15 145 / 0.25)",
            border: "1px solid oklch(0.55 0.18 145 / 0.4)",
            color: "oklch(0.80 0.12 145)",
          }}
        >
          Assinatura ativada com sucesso! Obrigado por assinar o Lexo.
        </div>
      )}

      {/* Status atual */}
      <div
        className="rounded-xl px-5 py-4 flex items-center justify-between"
        style={{
          background: "oklch(0.14 0.016 264 / 0.6)",
          border: "1px solid oklch(1 0 0 / 0.07)",
        }}
      >
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Plano atual</p>
          <p className="font-semibold">{PLAN_LABELS[currentPlan] ?? currentPlan}</p>
          {!paid && !expired && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {daysLeft === 0 ? "Expira hoje" : `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restantes no trial`}
            </p>
          )}
          {expired && (
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.70 0.15 25)" }}>
              Trial expirado — escolha um plano abaixo
            </p>
          )}
        </div>
        {paid && isAdmin && org?.stripeCustomerId && (
          <form action={createPortalSession}>
            <Button variant="outline" size="sm" type="submit">
              Gerenciar assinatura
            </Button>
          </form>
        )}
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-2xl">
        {PLANS.map((plan) => {
          const priceId = process.env[plan.priceEnvKey];
          const isCurrent = currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              className="relative rounded-2xl p-6 flex flex-col gap-5"
              style={
                plan.highlight
                  ? {
                      background: "oklch(0.14 0.025 274 / 0.8)",
                      border: "1px solid oklch(0.66 0.18 274 / 0.4)",
                      boxShadow: "0 0 40px oklch(0.66 0.18 274 / 0.08)",
                    }
                  : {
                      background: "oklch(0.14 0.016 264 / 0.6)",
                      border: "1px solid oklch(1 0 0 / 0.07)",
                    }
              }
            >
              {plan.highlight && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold"
                  style={{
                    background: "linear-gradient(90deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))",
                    color: "#fff",
                  }}
                >
                  Mais popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{plan.label}</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : isAdmin && priceId ? (
                  <form action={createCheckoutSession.bind(null, priceId)}>
                    <Button
                      className="w-full"
                      style={
                        plan.highlight
                          ? {
                              background: "linear-gradient(90deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))",
                              color: "#fff",
                              border: "none",
                            }
                          : undefined
                      }
                      type="submit"
                    >
                      Assinar {plan.label}
                    </Button>
                  </form>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {isAdmin ? "Configurar Stripe primeiro" : "Fale com o administrador"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
